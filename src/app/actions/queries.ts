'use server'

import { prisma } from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache'

import { requireRole } from '@/utils/auth-helpers'

export async function getAppData() {
  noStore();
  try {
    const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
    
    // Todos pueden ver el catálogo activo
    const products = role === 'admin' ? await prisma.product.findMany({ orderBy: { createdAt: 'desc' } }) : [];

    let customers: any[] = [];
    let sellers: any[] = [];
    let orders: any[] = [];

    if (role === 'admin') {
      customers = await prisma.customer.findMany();
      sellers = await prisma.seller.findMany();
      orders = await prisma.order.findMany({
        include: { items: { include: { product: true } }, customer: true, seller: true, groups: { include: { items: true } } },
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
          include: { items: { include: { product: true } }, customer: true, groups: { include: { items: true } } },
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


export async function getAdminLatestOrderIds() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };
    const orders = await prisma.order.findMany({
      select: { id: true, orderNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return { success: true, orders: orders.map(o => ({ id: o.id, number: o.orderNumber })) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getClientOrderStatuses() {
  noStore();
  try {
    const { user, role } = await requireRole(['cliente']);
    if (role !== 'cliente') return { success: false };
    
    const customerProfile = await prisma.customer.findUnique({ where: { authUserId: user.id } });
    if (!customerProfile) return { success: false };

    const orders = await prisma.order.findMany({
      where: { customerId: customerProfile.id },
      select: { id: true, orderNumber: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return { success: true, orders: orders.map(o => ({ id: o.id, number: o.orderNumber, status: o.status })) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getClientActiveProductsDigest() {
  noStore();
  try {
    const { role } = await requireRole(['cliente']);
    if (role !== 'cliente') return { success: false };
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, physicalStock: true, reservedStock: true }
    });
    return { success: true, products: products.map(p => ({
      id: p.id,
      physicalStock: p.physicalStock,
      reservedStock: p.reservedStock
    })) };
  } catch (error: any) {
    return { success: false };
  }
}

export async function getSellerOrderStates() {
  noStore();
  try {
    const { user, role } = await requireRole(['vendedor']);
    if (role !== 'vendedor') return { success: false };
    
    const sellerProfile = await prisma.seller.findUnique({ where: { authUserId: user.id } });
    if (!sellerProfile) return { success: false };

    const orders = await prisma.order.findMany({
      where: { sellerId: sellerProfile.id },
      select: { id: true, orderNumber: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return { success: true, orders: orders.map(o => ({ id: o.id, number: o.orderNumber, status: o.status })) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPagedCatalog({ 
  material, 
  category, 
  search, 
  limit = 24, 
  cursor 
}: { 
  material?: string;
  category?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  noStore();
  try {
    const { role } = await requireRole(['admin', 'vendedor', 'cliente']);
    
    // Build where clause
    const where: any = {};
    if (role !== 'admin') {
      where.isActive = true;
      where.imageUrl = { not: null };
      where.material = { not: 'Por revisar' };
      // physicalStock - reservedStock > 0 is tricky in Prisma count/where directly without raw query or separate fields, 
      // wait! We can just fetch them and filter, but that breaks cursor pagination.
      // Actually, if we just check physicalStock > 0 or reservedStock < physicalStock... Prisma doesn't support comparing two columns directly in where unless we use where: { physicalStock: { gt: prisma.product.fields.reservedStock } } in Prisma 5? 
      // Prisma 5 supports comparing columns? Actually simpler: we can use a raw query if needed, or if the requirement allows, we just fetch with a generous limit and filter, or just use raw query.
    }
    
    if (material && material !== 'Todos') {
      where.material = material;
    }
    if (category && category !== 'Todos') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const items = await prisma.product.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { category: 'asc' }, // To keep groups together
        { createdAt: 'desc' },
        { id: 'asc' } // deterministic tie-breaker
      ]
    });

    // In JS we filter out zero-stock items for clients/sellers just in case,
    // though this might result in fewer than 'limit' items returned. The frontend will just ask for more if needed.
    let filteredItems = items;
    if (role !== 'admin') {
      filteredItems = items.filter(p => (p.physicalStock - p.reservedStock) > 0);
    }

    let hasMore = false;
    if (items.length > limit) {
      hasMore = true;
      // We pop from the ORIGINAL items to find the real next cursor
      items.pop();
    }
    
    // If we filtered out items, we still use the cursor from the original items array to continue properly.
    const nextCursor = items.length > 0 ? items[items.length - 1].id : undefined;
    
    // Also return only the filtered items that are within the current page limit
    const finalItems = role !== 'admin' ? items.filter(p => (p.physicalStock - p.reservedStock) > 0) : items;

    return {
      success: true,
      products: finalItems,
      hasMore,
      nextCursor
    };

  } catch (error: any) {
    console.error('Error fetching paged catalog:', error);
    return { success: false, products: [], hasMore: false };
  }
}
