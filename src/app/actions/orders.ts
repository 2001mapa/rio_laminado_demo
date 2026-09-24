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
        if (seller.status !== 'active') throw new Error('Cuenta de vendedor suspendida');
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
        let subtotal = 0;
        const orderItemsByMaterial: Record<string, any[]> = {};

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
          
          if (!product.material || product.material === 'Por revisar') {
            throw new Error(`El producto ${product.name} no tiene un material definido (Por revisar). No se puede vender.`);
          }
          
          const available = product.physicalStock - product.reservedStock;
          if (item.quantity > available) {
            throw new Error(`Stock insuficiente para ${product.name}. Solo quedan ${available}.`);
          }
          
          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: {
              reservedStock: { increment: item.quantity }
            }
          });

          if (updatedProduct.reservedStock > updatedProduct.physicalStock) {
            throw new Error(`Conflicto de concurrencia: Stock agotado para ${product.name}.`);
          }

          const price = product.price;
          subtotal += price * item.quantity;
          
          const mat = product.material;
          if (!orderItemsByMaterial[mat]) orderItemsByMaterial[mat] = [];
          orderItemsByMaterial[mat].push({
            productId: product.id,
            quantity: item.quantity,
            priceAtTime: price,
            materialSnapshot: mat
          });
        }
        
        const totalAmount = subtotal * (1 - discount);
        const orderNumber = `PED-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerId: finalCustomerId,
            sellerId: finalSellerId,
            status: 'Reservado',
            totalAmount: totalAmount,
          }
        });
        
        for (const [material, items] of Object.entries(orderItemsByMaterial)) {
           const materialCode = material.substring(0, 3).toUpperCase();
           const group = await tx.orderMaterialGroup.create({
             data: {
                orderId: newOrder.id,
                material,
                groupNumber: `${orderNumber}-${materialCode}`,
                status: 'Pendiente'
             }
           });
           
           await tx.orderItem.createMany({
             data: items.map(item => ({
               ...item,
               orderId: newOrder.id,
               materialGroupId: group.id
             }))
           });
        }
        
        return await tx.order.findUnique({
           where: { id: newOrder.id },
           include: { items: true, groups: { include: { items: true } } }
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


export async function transitionOrder(orderId: string, action: OrderTransitionAction, reason?: string, trackingInfo?: {carrier: string, trackingNumber: string}) {
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
      
      const updateData: any = { status: nextStatus };
      if (action === 'DISPATCH' && trackingInfo) {
        updateData.carrier = trackingInfo.carrier;
        updateData.trackingNumber = trackingInfo.trackingNumber;
      }

      return await tx.order.update({
        where: { id: orderId },
        data: updateData
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

export async function updateMaterialGroupInvoice(groupId: string, invoice: string) {
  try {
    await requireRole(['admin']);
    const group = await prisma.orderMaterialGroup.findUnique({
       where: { id: groupId },
       include: { order: { include: { groups: true } } }
    });
    if (!group) throw new Error("Grupo no encontrado");
    if (!invoice.trim()) throw new Error("El número de factura no puede estar vacío");

    // Verificar unicidad externa dentro del pedido
    const duplicate = group.order.groups.find(g => g.id !== groupId && g.externalInvoice === invoice.trim());
    if (duplicate) throw new Error("El número de factura externa ya está registrado en otro grupo de este pedido");

    await prisma.orderMaterialGroup.update({
       where: { id: groupId },
       data: { 
         externalInvoice: invoice.trim(),
         status: 'Preparado y Facturado',
         isVerified: true
       }
    });

    // Auto-avanzar el pedido principal si todos los grupos están facturados y el pedido sigue en preparación
    const updatedOrder = await prisma.order.findUnique({
      where: { id: group.orderId },
      include: { groups: true }
    });

    const allInvoiced = updatedOrder?.groups.every(g => g.externalInvoice);
    if (allInvoiced && updatedOrder?.status === 'En preparación') {
      await transitionOrder(group.orderId, 'SEND_TO_VERIFICATION', 'Autocompletado al facturar todos los materiales');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
