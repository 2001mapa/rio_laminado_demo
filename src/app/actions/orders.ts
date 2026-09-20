'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/utils/auth-helpers'

export async function createOrder(data: {
  customerId: string;
  sellerId: string;
  items: { productId: string; quantity: number; priceAtTime: number }[];
  totalAmount: number;
}) {
  // Solo cliente y vendedor pueden crear pedidos
  await requireRole(['cliente', 'vendedor', 'admin']);
  
  try {
    // Transacción atómica
    const order = await prisma.$transaction(async (tx) => {
      // 1. Verificar inventario para cada producto
      for (const item of data.items) {
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
        
        // 2. Incrementar stock reservado
        await tx.product.update({
          where: { id: product.id },
          data: {
            reservedStock: { increment: item.quantity }
          }
        });
      }
      
      // 3. Crear el pedido
      return await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          customerId: data.customerId,
          sellerId: data.sellerId,
          status: 'Reservado',
          totalAmount: data.totalAmount,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.priceAtTime
            }))
          }
        },
        include: {
          items: true
        }
      });
    });
    
    return { success: true, order };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireRole(['admin', 'vendedor']);
  
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      
      if (!existingOrder) throw new Error('Pedido no encontrado');
      
      // Si se cancela, se debe liberar el stock reservado
      if (status === 'Cancelado' && existingOrder.status !== 'Cancelado') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { decrement: item.quantity } }
          });
        }
      }
      
      // Si se pasa a Entregado/Despachado, el stock reservado se convierte en salida definitiva
      // (Baja physicalStock y baja reservedStock al mismo tiempo)
      if ((status === 'Despachado' || status === 'Entregado') && 
          existingOrder.status !== 'Despachado' && existingOrder.status !== 'Entregado') {
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
      
      return await tx.order.update({
        where: { id: orderId },
        data: { status }
      });
    });
    
    return { success: true, order };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}
