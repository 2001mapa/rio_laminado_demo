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
    const baseWhere: any = {};
    if (role !== 'admin') {
      baseWhere.isActive = true;
      if (role === 'cliente') {
        baseWhere.imageUrl = { not: null };
        baseWhere.material = { not: 'Por revisar' };
      }
    }
    
    if (category && category !== 'Todos') {
      if (!search) {
        baseWhere.category = { gte: category };
      } else {
        baseWhere.category = category;
      }
    }
    
    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Materiales con stock real disponible para los filtros actuales (sin incluir material)
    const allFilteredProducts = await prisma.product.findMany({
      where: baseWhere,
      select: { material: true, physicalStock: true, reservedStock: true }
    });
    
    const availableMaterialsSet = new Set<string>();
    for (const p of allFilteredProducts) {
      if (role === 'admin' || (p.physicalStock - p.reservedStock) > 0) {
        if (p.material) availableMaterialsSet.add(p.material);
      }
    }
    
    // Orden canónico
    const canonicalOrder = ['Laminado', 'Plata', 'Rodio'];
    const availableMaterials = Array.from(availableMaterialsSet).sort((a, b) => {
       const idxA = canonicalOrder.indexOf(a);
       const idxB = canonicalOrder.indexOf(b);
       if (idxA >= 0 && idxB >= 0) return idxA - idxB;
       if (idxA >= 0) return -1;
       if (idxB >= 0) return 1;
       return a.localeCompare(b);
    });

    const where: any = { ...baseWhere };
    if (material && material !== 'Todos') {
      where.material = material;
    }

    // Paginación continua saltando agotados
    let finalItems: any[] = [];
    let currentCursor = cursor;
    let hasMore = true;
    let fallbackHasMore = false;
    
    while (finalItems.length < limit && hasMore) {
      const takeCount = (limit - finalItems.length) + 1;
      const queryArgs: any = {
        where,
        take: takeCount,
        orderBy: [
          { category: 'asc' },
          { createdAt: 'desc' },
          { id: 'asc' }
        ]
      };
      
      if (currentCursor) {
         queryArgs.cursor = { id: currentCursor };
         queryArgs.skip = 1;
      }
      
      const chunk = await prisma.product.findMany(queryArgs);
      
      if (chunk.length === 0) {
         hasMore = false;
         break;
      }
      
      fallbackHasMore = chunk.length === takeCount;
      const itemsToProcess = fallbackHasMore ? chunk.slice(0, -1) : chunk;
      
      if (itemsToProcess.length > 0) {
         currentCursor = itemsToProcess[itemsToProcess.length - 1].id;
      } else if (fallbackHasMore) {
         currentCursor = chunk[0].id;
      }
      
      for (const item of itemsToProcess) {
        if (role === 'admin' || (item.physicalStock - item.reservedStock) > 0) {
          finalItems.push(item);
          if (finalItems.length === limit) break;
        }
      }
      
      if (!fallbackHasMore && finalItems.length < limit) {
         hasMore = false;
      }
      if (finalItems.length === limit && fallbackHasMore) {
         hasMore = true; 
      }
    }
    
    const nextCursor = finalItems.length > 0 ? finalItems[finalItems.length - 1].id : undefined;

    return {
      success: true,
      products: finalItems,
      hasMore,
      nextCursor,
      availableMaterials
    };

  } catch (error: any) {
    console.error('Error fetching paged catalog:', error);
    return {
      success: false,
      error: error.message
    };
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
