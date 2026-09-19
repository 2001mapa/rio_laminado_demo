'use server'

import { prisma } from '@/lib/prisma'

export async function createOrder(data: {
  customerId: string;
  sellerId: string;
  items: { productId: string; quantity: number; priceAtTime: number }[];
  total: number;
  discountApplied: number;
}) {
  try {
    const order = await prisma.order.create({
      data: {
        customerId: data.customerId,
        sellerId: data.sellerId,
        status: 'pending',
        total: data.total,
        discountApplied: data.discountApplied,
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
    return { success: true, order };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    return { success: true, order };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}
