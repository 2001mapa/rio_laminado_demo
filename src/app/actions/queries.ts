'use server'

import { prisma } from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache'

import { requireRole } from '@/utils/auth-helpers'

export async function getAppData() {
  noStore();
  try {
    const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
    
    // Todos pueden ver el catálogo activo
    const products = await prisma.product.findMany({
      where: role !== 'admin' ? { isActive: true } : undefined
    });

    let customers = [];
    let sellers = [];
    let orders = [];

    if (role === 'admin') {
      customers = await prisma.customer.findMany();
      sellers = await prisma.seller.findMany();
      orders = await prisma.order.findMany({
        include: { items: { include: { product: true } }, customer: true, seller: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'vendedor') {
      // El vendedor ve clientes autorizados (por simplicidad, todos activos) y sus propios pedidos
      customers = await prisma.customer.findMany({ where: { status: 'active' } });
      const sellerProfile = await prisma.seller.findUnique({ where: { authUserId: user.id } });
      if (sellerProfile) {
        sellers = [sellerProfile];
        orders = await prisma.order.findMany({
          where: { sellerId: sellerProfile.id },
          include: { items: { include: { product: true } }, customer: true },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (role === 'cliente') {
      // El cliente solo ve su perfil y sus pedidos
      const customerProfile = await prisma.customer.findUnique({ where: { authUserId: user.id } });
      if (customerProfile) {
        customers = [customerProfile];
        orders = await prisma.order.findMany({
          where: { customerId: customerProfile.id },
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

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
