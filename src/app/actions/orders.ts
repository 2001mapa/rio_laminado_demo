'use server'
import { OrderTransitionAction, getNextState } from '@/lib/order-status';

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/utils/auth-helpers'

export async function createOrder(data: {
  customerId?: string; // Solo requerido/confiado si es vendedor o admin
  items: { productId: string; quantity: number }[];
}) {
  const { user, role } = await requireRole(['cliente', 'vendedor', 'admin']);
  
  try {
    let finalCustomerId: string;
    let finalSellerId: string | null = null;
    let discount = 0;

    // 1. Resolver identidades de forma segura
    if (role === 'cliente') {
      const customer = await prisma.customer.findUnique({ where: { authUserId: user.id } });
      if (!customer) throw new Error('Perfil de cliente no encontrado');
      finalCustomerId = customer.id;
      // Para pedidos directos de cliente, sellerId siempre es null
    } else {
      if (!data.customerId) throw new Error('Se requiere el ID del cliente para crear el pedido');
      finalCustomerId = data.customerId;
      
      if (role === 'vendedor') {
        const seller = await prisma.seller.findUnique({ where: { authUserId: user.id } });
        if (!seller) throw new Error('Perfil de vendedor no encontrado');
        finalSellerId = seller.id;
      }
    }

    // Obtener detalles del cliente para aplicar descuentos reales
    const targetCustomer = await prisma.customer.findUnique({ where: { id: finalCustomerId } });
    if (!targetCustomer) throw new Error('Cliente objetivo no encontrado');
    if (targetCustomer.showDiscount) {
      discount = targetCustomer.discount / 100;
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('El pedido debe tener al menos un artículo.');
    }

    // Transacción atómica
    const order = await prisma.$transaction(async (tx) => {
      // 2. Verificar inventario y preparar items con precios de la base de datos
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of data.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error('Cantidad inválida.');
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!product || !product.isActive) {
          throw new Error(`Producto no encontrado o inactivo.`);
        }
        
        const available = product.physicalStock - product.reservedStock;
        if (item.quantity > available) {
          throw new Error(`Stock insuficiente para ${product.name}. Solo quedan ${available}.`);
        }
        
        // 3. Incrementar stock reservado usando increment atómico
        // Aunque estamos en transacción, el incremento es seguro
        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: {
            reservedStock: { increment: item.quantity }
          }
        });

        // Verificación optimista de concurrencia
        if (updatedProduct.reservedStock > updatedProduct.physicalStock) {
          throw new Error(`Conflicto de concurrencia: Stock agotado para ${product.name}.`);
        }

        const price = product.price;
        subtotal += price * item.quantity;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtTime: price
        });
      }
      
      const totalAmount = subtotal * (1 - discount);

      // 4. Crear el pedido
      return await tx.order.create({
        data: {
          orderNumber: `PED-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
          customerId: finalCustomerId,
          sellerId: finalSellerId,
          status: 'Reservado',
          totalAmount: totalAmount,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });
    }, {
      maxWait: 5000, 
      timeout: 10000 
    });
    
    return { success: true, order };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}


export async function transitionOrder(orderId: string, action: OrderTransitionAction, reason?: string) {
  const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
  
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true }
      });
      
      if (!existingOrder) throw new Error('Pedido no encontrado');

      if (role === 'cliente') {
        if (existingOrder.customer.authUserId !== user.id) throw new Error('No autorizado');
        if (action !== 'CANCEL') throw new Error('El cliente solo puede cancelar');
        if (existingOrder.status !== 'Reservado') throw new Error('Solo puedes cancelar pedidos en estado Reservado');
      } else if (role === 'vendedor') {
        throw new Error('Vendedor no autorizado para cambiar estados');
      }
      
      const nextStatus = getNextState(existingOrder.status, action);

      if (action === 'CANCEL' && existingOrder.status !== 'Cancelado') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { decrement: item.quantity } }
          });
        }
      }
      
      if (action === 'DISPATCH' && existingOrder.status !== 'Despachado') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              physicalStock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: existingOrder.status,
          nextStatus,
          action,
          actorAuthUserId: user.id,
          actorRole: role,
          reason
        }
      });
      
      return await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus }
      });
    }, { maxWait: 5000, timeout: 10000 });
    
    return { success: true, order };
  } catch (error: any) {
    console.error('Error transitioning order:', error);
    return { success: false, error: error.message };
  }
}

export async function acknowledgeOrderAdjustment(orderId: string) {
  const { user, role } = await requireRole(['cliente']);
  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });
    if (!existingOrder) throw new Error('Pedido no encontrado');
    if (existingOrder.customer.authUserId !== user.id) throw new Error('No autorizado');
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { adjustmentAcknowledged: true }
    });
    return { success: true, order };
  } catch (error: any) {
    console.error('Error acknowledging adjustment:', error);
    return { success: false, error: error.message };
  }
}
export async function updateOrderChecklist(orderId: string, items: { id: string, newQuantity: number, adjustmentReason?: string, verified?: boolean, issue?: string | null }[], adjustmentAcknowledged: boolean = false) {
  await requireRole(['admin']);
  
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      
      if (!existingOrder) throw new Error('Pedido no encontrado');
      
      for (const update of items) {
        const existingItem = existingOrder.items.find(i => i.id === update.id);
        if (!existingItem) continue;

        const needsQuantityUpdate = update.newQuantity !== existingItem.quantity;
        const needsVerificationUpdate = update.verified !== existingItem.verified || update.issue !== existingItem.issue;

        if (needsQuantityUpdate) {
          const diff = existingItem.quantity - update.newQuantity;

          await tx.product.update({
            where: { id: existingItem.productId },
            data: { reservedStock: { decrement: diff } }
          });
        }

        if (needsQuantityUpdate || needsVerificationUpdate) {
          await tx.orderItem.update({
            where: { id: update.id },
            data: {
              ...(needsQuantityUpdate ? {
                originalQuantity: existingItem.originalQuantity || existingItem.quantity,
                quantity: update.newQuantity,
                adjustmentReason: update.adjustmentReason || null
              } : {}),
              verified: update.verified ?? existingItem.verified,
              issue: update.issue ?? existingItem.issue
            }
          });
        }
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true }
      });

      if (!updatedOrder) throw new Error('Pedido no encontrado tras actualización');

      const discount = updatedOrder.customer?.showDiscount ? updatedOrder.customer.discount / 100 : 0;
      const newSubtotal = updatedOrder.items.reduce((acc, item) => acc + (item.priceAtTime * item.quantity), 0);
      const newTotalAmount = newSubtotal * (1 - discount);

      return await tx.order.update({
        where: { id: orderId },
        data: { 
          totalAmount: newTotalAmount,
          adjustmentAcknowledged
        },
        include: { items: { include: { product: true } } }
      });
    });

    return { success: true, order };
  } catch (error: any) {
    console.error('Error updating order checklist:', error);
    return { success: false, error: error.message };
  }
}
