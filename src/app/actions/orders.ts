'use server'

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

export async function updateOrderStatus(orderId: string, status: string) {
  const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
  
  // Definición de estados válidos
  const validStates = [
    'Reservado',
    'Confirmado',
    'En preparación',
    'Pendiente de verificación',
    'Verificado',
    'Empacado',
    'Despachado',
    'Cancelado'
  ];

  if (!validStates.includes(status)) {
    return { success: false, error: 'Estado inválido' };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true }
      });
      
      if (!existingOrder) throw new Error('Pedido no encontrado');

      // Validaciones de permisos por rol
      if (role === 'cliente') {
        if (existingOrder.customer.authUserId !== user.id) {
          throw new Error('No autorizado para modificar este pedido');
        }
        if (status !== 'Cancelado') {
          throw new Error('El cliente solo puede cancelar el pedido');
        }
        if (existingOrder.status !== 'Reservado') {
          throw new Error('Solo puedes cancelar pedidos en estado "Reservado"');
        }
      } else if (role === 'vendedor') {
        // Asumimos que los vendedores no pueden pasar a despachado (solo si es política de negocio)
        // Pero si pueden, validamos que no estén cambiando pedidos de otros clientes si así se desea
      }
      
      // Si se cancela, se debe liberar el stock reservado (y asegurarse que no estaba ya cancelado ni despachado)
      if (status === 'Cancelado' && existingOrder.status !== 'Cancelado') {
        // No se puede cancelar si ya fue despachado
        if (existingOrder.status === 'Despachado' || existingOrder.status === 'Entregado') {
           throw new Error('No se puede cancelar un pedido que ya fue despachado');
        }

        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { decrement: item.quantity } }
          });
        }
      }
      
      // Si se pasa a Entregado/Despachado, el stock reservado se convierte en salida definitiva
      // (Baja physicalStock y baja reservedStock al mismo tiempo)
      if (status === 'Despachado' && existingOrder.status !== 'Despachado') {
        // Regla: si estaba cancelado, no se puede despachar directamente, primero volver a Reservado
        if (existingOrder.status === 'Cancelado') {
          throw new Error('No se puede despachar un pedido cancelado sin reservarlo nuevamente');
        }
        for (const item of existingOrder.items) {
          // Si el pedido fue ajustado (originalQuantity existe), debitar solo la quantity actual
          // Nota: La quantity actual ya debería ser la final en el orderItem
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              physicalStock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });
        }
      }
      
      return await tx.order.update({
        where: { id: orderId },
        data: { status }
      });
    }, {
      maxWait: 5000,
      timeout: 10000
    });
    
    return { success: true, order };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}
export async function updateOrderChecklist(orderId: string, items: { id: string, newQuantity: number, adjustmentReason?: string }[], adjustmentAcknowledged: boolean = false) {
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

        if (update.newQuantity !== existingItem.quantity) {
          const diff = existingItem.quantity - update.newQuantity; // e.g., 5 - 3 = 2 removed

          // Update product reservedStock
          await tx.product.update({
            where: { id: existingItem.productId },
            data: { reservedStock: { decrement: diff } }
          });

          await tx.orderItem.update({
            where: { id: update.id },
            data: {
              originalQuantity: existingItem.originalQuantity || existingItem.quantity,
              quantity: update.newQuantity,
              adjustmentReason: update.adjustmentReason || null
            }
          });
        }
      }

      // Recalculate total
      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true }
      });

      if (!updatedOrder) throw new Error('Pedido no encontrado tras actualizaci�n');

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
