'use server'

import { prisma } from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache'

export async function getAppData() {
  noStore();
  try {
    const products = await prisma.product.findMany();
    const customers = await prisma.customer.findMany();
    const sellers = await prisma.seller.findMany();
    const orders = await prisma.order.findMany({
      include: {
        items: true
      }
    });

    return {
      success: true,
      data: {
        products,
        customers,
        sellers,
        orders
      }
    }
  } catch (error: any) {
    console.error('Error fetching app data:', error)
    return { success: false, error: error.message }
  }
}
