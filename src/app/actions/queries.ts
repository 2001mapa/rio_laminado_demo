'use server'

import { prisma } from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache'

import { requireRole } from '@/utils/auth-helpers'

export async function getAppData() {
  noStore();
  try {
    const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
    
    const products: any[] = [];

    let customers: any[] = [];
    let sellers: any[] = [];
    let orders: any[] = [];

    if (role === 'admin') {
      customers = await prisma.customer.findMany();
      sellers = await prisma.seller.findMany();
      orders = await prisma.order.findMany({
        where: { status: { notIn: ['Despachado', 'Cancelado'] } },
        include: { items: { include: { product: true } }, customer: true, seller: true, groups: { include: { items: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
    } else if (role === 'vendedor') {
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
      data: { products, customers, sellers, orders }
    }
  } catch (error: any) {
    console.error('Error fetching app data:', error)
    return { success: false, error: error.message }
  }
}

export async function getAdminStats() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };

    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    const totalOrders = statusCounts.reduce((acc, curr) => acc + curr._count.id, 0);
    const counts = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const validOrderIds = await prisma.order.findMany({
      where: { status: { not: 'Cancelado' } },
      select: { id: true }
    });
    const validIds = validOrderIds.map(o => o.id);
    const unitsAggr = await prisma.orderItem.aggregate({
      where: { orderId: { in: validIds } },
      _sum: { quantity: true }
    });
    const totalUnitsSold = unitsAggr._sum.quantity || 0;

    const lowStockProducts = await prisma.product.findMany({
      select: { physicalStock: true, reservedStock: true }
    });
    const lowStockCount = lowStockProducts.filter(p => (p.physicalStock - p.reservedStock) > 0 && (p.physicalStock - p.reservedStock) <= 5).length;
    const outOfStockCount = lowStockProducts.filter(p => (p.physicalStock - p.reservedStock) <= 0).length;

    return {
      success: true,
      stats: {
        newOrders: (counts['Reservado'] || 0) + (counts['Confirmado'] || 0),
        inPrepOrders: counts['En preparación'] || 0,
        pendingVerify: counts['Pendiente de verificación'] || 0,
        verifiedOrders: (counts['Verificado'] || 0) + (counts['Empacado'] || 0),
        totalOrders,
        totalUnitsSold,
        validOrdersCount: validIds.length,
        lowStockCount,
        outOfStockCount
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPagedAdminOrders({ status, search, limit = 50, cursor }: { status?: string, search?: string, limit?: number, cursor?: string }) {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };

    const where: any = {};
    if (status && status !== 'Todos') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: { 
        items: { include: { product: true } }, 
        customer: true, 
        seller: true, 
        groups: { include: { items: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });

    let hasMore = false;
    if (orders.length > limit) {
      hasMore = true;
      orders.pop();
    }
    const nextCursor = orders.length > 0 ? orders[orders.length - 1].id : undefined;

    return { success: true, orders, hasMore, nextCursor };
  } catch (error: any) {
    return { success: false, error: error.message };
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
      
      // Los vendedores pueden ver productos sin foto (para vender en mostrador). Los clientes no.
      if (role === 'cliente') {
        where.imageUrl = { not: null };
        where.material = { not: 'Por revisar' };
      }
      // physicalStock - reservedStock > 0 is tricky in Prisma count/where directly without raw query or separate fields, 
      // wait! We can just fetch them and filter, but that breaks cursor pagination.
      // Actually, if we just check physicalStock > 0 or reservedStock < physicalStock... Prisma doesn't support comparing two columns directly in where unless we use where: { physicalStock: { gt: prisma.product.fields.reservedStock } } in Prisma 5? 
      // Prisma 5 supports comparing columns? Actually simpler: we can use a raw query if needed, or if the requirement allows, we just fetch with a generous limit and filter, or just use raw query.
    }
    
    if (material && material !== 'Todos') {
      where.material = material;
    }
    if (category && category !== 'Todos') {
        if (!search) {
          where.category = { gte: category };
        } else {
          where.category = category;
        }
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
        skip: cursor ? 1 : 0,
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

export async function getAdminMaterialCounts() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };

    const counts = await prisma.product.groupBy({
      by: ['material'],
      _count: { id: true }
    });

    const total = await prisma.product.count();

    const result: Record<string, number> = {
      Todos: total,
      Laminado: 0,
      Plata: 0,
      Rodio: 0,
      'Por revisar': 0
    };

    counts.forEach(c => {
      const mat = c.material || 'Por revisar';
      if (result[mat] !== undefined) {
         result[mat] = c._count.id;
      } else {
         result['Por revisar'] += c._count.id; // Any weird material falls into "Por revisar" or is ignored
      }
    });

    return { success: true, counts: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPrintableProducts() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };

    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        material: true,
        price: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getExactProductBySku(sku: string) {
  noStore();
  try {
    const { role } = await requireRole(['admin', 'vendedor']);
    
    const normalizedSku = sku.trim().toUpperCase();
    
    const product = await prisma.product.findFirst({
      where: { sku: normalizedSku }
    });

    if (!product) {
      return { success: false, reason: 'not_found', error: 'Referencia inexistente.' };
    }

    if (!product.isActive) {
      return { success: false, reason: 'inactive', error: 'El producto se encuentra inactivo.' };
    }

    if (product.physicalStock <= 0) {
      return { success: false, reason: 'out_of_stock', error: 'El producto está agotado.' };
    }

    return { success: true, product };
  } catch (error: any) {
    console.error('Error buscando producto por SKU:', error);
    return { success: false, reason: 'server_error', error: error.message };
  }
}
