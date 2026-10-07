'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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
          where: { customerId: customerProfile.id, sellerId: null },
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
    return { success: false, error: error.message, errorCode: error.code }
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
    return { success: false, error: error.message, errorCode: error.code };
  }
}

export type DashboardPeriod = 'today' | '7d' | '30d';

export async function getAdminDashboard(period: DashboardPeriod = '7d') {
  noStore();
  try {
    await requireRole(['admin']);
    if (!['today', '7d', '30d'].includes(period)) return { success: false, error: 'Período inválido' };

    const now = new Date();
    const colombiaToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    colombiaToday.setUTCMinutes(colombiaToday.getUTCMinutes() - 300);
    if (now < colombiaToday) colombiaToday.setUTCDate(colombiaToday.getUTCDate() - 1);
    const start = new Date(colombiaToday);
    if (period === '7d') start.setUTCDate(start.getUTCDate() - 6);
    if (period === '30d') start.setUTCDate(start.getUTCDate() - 29);
    const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()));
    const periodWhere = { createdAt: { gte: start, lte: now }, status: { not: 'Cancelado' } };
    const previousWhere = { createdAt: { gte: previousStart, lt: start }, status: { not: 'Cancelado' } };
    const urgentWhere = { status: { in: ['Reservado', 'Pendiente de verificación'] } };
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [reserved, olderReserved, pendingVerify, pendingErp, urgentCount, urgentOrders,
      directOrders, sellerOrders, currentOrders, previousOrders, units, topProductGroups,
      topClientGroups, stockRows, lastInventoryUpdate] = await Promise.all([
      prisma.order.count({ where: { status: 'Reservado' } }),
      prisma.order.count({ where: { status: 'Reservado', createdAt: { lt: cutoff24h } } }),
      prisma.order.count({ where: { status: 'Pendiente de verificación' } }),
      prisma.customer.count({ where: { internalSystemStatus: 'Pendiente' } }),
      prisma.order.count({ where: urgentWhere }),
      prisma.order.findMany({ where: urgentWhere, orderBy: { createdAt: 'asc' }, take: 5, select: { id: true, orderNumber: true, status: true, createdAt: true, customer: { select: { name: true } } } }),
      prisma.order.findMany({ where: { sellerId: null }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, orderNumber: true, status: true, createdAt: true, customer: { select: { name: true } } } }),
      prisma.order.findMany({ where: { sellerId: { not: null } }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, orderNumber: true, status: true, createdAt: true, customer: { select: { name: true } } } }),
      prisma.order.count({ where: periodWhere }),
      prisma.order.count({ where: previousWhere }),
      prisma.orderItem.aggregate({ where: { order: periodWhere }, _sum: { quantity: true } }),
      prisma.orderItem.groupBy({ by: ['productId'], where: { order: periodWhere }, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 4 }),
      prisma.order.groupBy({ by: ['customerId'], where: periodWhere, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 4 }),
      prisma.product.findMany({ where: { isActive: true }, select: { physicalStock: true, reservedStock: true } }),
      prisma.auditEvent.findFirst({ where: { action: { in: ['BULK_UPLOAD', 'UPDATE_INVENTORY'] }, result: 'success' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
    ]);
    const [productDetails, customerDetails] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: topProductGroups.map(p => p.productId) } }, select: { id: true, name: true, sku: true, imageUrl: true } }),
      prisma.customer.findMany({ where: { id: { in: topClientGroups.map(c => c.customerId) } }, select: { id: true, name: true, city: true, address: true } })
    ]);
    const productsById = new Map(productDetails.map(p => [p.id, p]));
    const customersById = new Map(customerDetails.map(c => [c.id, c]));
    return { success: true, data: {
      reserved, olderReserved, pendingVerify, pendingErp, urgentCount, urgentOrders, directOrders, sellerOrders,
      currentOrders, previousOrders, totalUnits: units._sum.quantity || 0,
      topProducts: topProductGroups.map(p => ({ ...productsById.get(p.productId), id: p.productId, qty: p._sum.quantity || 0 })),
      topClients: topClientGroups.map(c => ({ ...customersById.get(c.customerId), id: c.customerId, orderCount: c._count.id })),
      outOfStockCount: stockRows.filter(p => p.physicalStock - p.reservedStock <= 0).length,
      lowStockCount: stockRows.filter(p => p.physicalStock - p.reservedStock > 0 && p.physicalStock - p.reservedStock <= 5).length,
      lastInventoryUpdate: lastInventoryUpdate?.createdAt || null,
      periodStart: start,
      periodEnd: now
    } };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cargar el panel' };
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
    return { success: false, error: error.message, errorCode: error.code };
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
    return { success: false, error: error.message, errorCode: error.code };
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
      where: { customerId: customerProfile.id, sellerId: null },
      select: { id: true, orderNumber: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return { success: true, orders: orders.map(o => ({ id: o.id, number: o.orderNumber, status: o.status })) };
  } catch (error: any) {
    return { success: false, error: error.message, errorCode: error.code };
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
    return { success: false, error: error.message, errorCode: error.code };
  }
}

export async function getPagedCatalog({ 
  material, 
  category, 
  search, 
  location, 
  limit = 24, 
  cursor,
  sortBy
}: { 
  material?: string;
  category?: string;
  search?: string;
  location?: string;
  limit?: number;
  cursor?: string;
  sortBy?: 'location_asc';
}) {
  noStore();
  try {
    const { role } = await requireRole(['admin', 'vendedor', 'cliente']);
    if (sortBy && (sortBy !== 'location_asc' || role !== 'admin')) {
      return { success: false, error: 'Orden no permitido' };
    }
    
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

    if (location && location !== 'Todas' && location !== 'Sin ubicación') {
      baseWhere.locationCode = location;
    } else if (location === 'Sin ubicación') {
      baseWhere.locationCode = { in: [null, ''] };
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
    if (material === 'Por revisar' && role === 'admin') {
      // "Por revisar" en admin funciona como filtro integral de revisión:
      // Material desconocido, ubicaciones duplicadas, o sin ubicación
      const duplicates = await prisma.product.groupBy({
        by: ['locationCode'],
        where: { locationCode: { not: '' }, NOT: { locationCode: null } },
        having: { locationCode: { _count: { gt: 1 } } }
      });
      const dupCodes = duplicates.map(d => d.locationCode).filter(Boolean) as string[];
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { material: 'Por revisar' },
            { locationCode: null },
            { locationCode: '' },
            { imageUrl: null },
            ...(dupCodes.length > 0 ? [{ locationCode: { in: dupCodes } }] : [])
          ]
        }
      ];

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { material: 'Por revisar' },
            { locationCode: null },
            { locationCode: '' },
            { imageUrl: null },
            ...(dupCodes.length > 0 ? [{ locationCode: { in: dupCodes } }] : [])
          ]
        }
      ];
    } else if (material && material !== 'Todos') {
      where.material = material;
    }

    if (sortBy === 'location_asc') {
      const filters: Prisma.Sql[] = [Prisma.sql`TRUE`];
      if (category && category !== 'Todos') {
        filters.push(search ? Prisma.sql`p."category" = ${category}` : Prisma.sql`p."category" >= ${category}`);
      }
      if (search) filters.push(Prisma.sql`(strpos(lower(p."name"), lower(${search})) > 0 OR strpos(lower(p."sku"), lower(${search})) > 0)`);
      if (location === 'Sin ubicación') filters.push(Prisma.sql`(p."locationCode" IS NULL OR p."locationCode" = '')`);
      else if (location && location !== 'Todas') filters.push(Prisma.sql`p."locationCode" = ${location}`);
      if (material === 'Por revisar') {
        filters.push(Prisma.sql`(p."material" = 'Por revisar' OR p."locationCode" IS NULL OR p."locationCode" = '' OR p."imageUrl" IS NULL OR EXISTS (
          SELECT 1 FROM "Product" other WHERE other."locationCode" = p."locationCode" AND other.id <> p.id AND other."locationCode" <> ''
        ))`);
      } else if (material && material !== 'Todos') filters.push(Prisma.sql`p."material" = ${material}`);

      const pageSize = Math.min(200, Math.max(1, Math.trunc(limit) || 24));
      const page = await prisma.$queryRaw<{ id: string }[]>`
        WITH ordered AS (
          SELECT p.id,
            CASE WHEN btrim(p."locationCode") ~ '^[0-9]+$' THEN 0
                 WHEN nullif(btrim(p."locationCode"), '') IS NULL THEN 2 ELSE 1 END AS bucket,
            CASE WHEN btrim(p."locationCode") ~ '^[0-9]+$' THEN btrim(p."locationCode")::numeric ELSE -1::numeric END AS location_number,
            coalesce(lower(btrim(p."locationCode")), '') AS location_label
          FROM "Product" p
          WHERE ${Prisma.join(filters, ' AND ')}
        )
        SELECT id FROM ordered
        WHERE ${cursor ? Prisma.sql`(bucket, location_number, location_label, id) >
          (SELECT bucket, location_number, location_label, id FROM ordered WHERE id = ${cursor})` : Prisma.sql`TRUE`}
        ORDER BY bucket, location_number, location_label, id
        LIMIT ${pageSize + 1}
      `;
      const pageIds = page.slice(0, pageSize).map(row => row.id);
      const pageProducts = await prisma.product.findMany({ where: { id: { in: pageIds } } });
      const byId = new Map(pageProducts.map(product => [product.id, product]));
      return {
        success: true,
        products: pageIds.map(id => byId.get(id)).filter((product): product is NonNullable<typeof product> => !!product),
        hasMore: page.length > pageSize,
        nextCursor: pageIds.at(-1),
        availableMaterials
      };
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
      if (mat === 'Laminado') result.Laminado = c._count.id;
      else if (mat === 'Plata') result.Plata = c._count.id;
      else if (mat === 'Rodio') result.Rodio = c._count.id;
    });

    const duplicates = await prisma.product.groupBy({
      by: ['locationCode'],
      where: { locationCode: { not: '' }, NOT: { locationCode: null } },
      having: { locationCode: { _count: { gt: 1 } } }
    });
    const dupCodes = duplicates.map(d => d.locationCode).filter(Boolean) as string[];

    const porRevisarCount = await prisma.product.count({
      where: {
        OR: [
          { material: 'Por revisar' },
          { locationCode: null },
          { locationCode: '' },
          { imageUrl: null },
          ...(dupCodes.length > 0 ? [{ locationCode: { in: dupCodes } }] : [])
        ]
      }
    });
    
    result['Por revisar'] = porRevisarCount;

    return { success: true, counts: result };
  } catch (error: any) {
    return { success: false, error: error.message, errorCode: error.code };
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
        locationCode: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message, errorCode: error.code };
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


export async function getDuplicateLocationsCount() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false, count: 0, locations: [] };
    
    const duplicates = await prisma.product.groupBy({
      by: ['locationCode'],
      where: { locationCode: { not: '' }, NOT: { locationCode: null } },
      having: {
        locationCode: { _count: { gt: 1 } }
      }
    });
    
    return { success: true, count: duplicates.length, locations: duplicates.map(d => d.locationCode).filter(Boolean) as string[] };
  } catch (error) {
    console.error('Error fetching duplicate locations:', error);
    return { success: false, count: 0 };
  }
}

export async function getProductsByIds(ids: string[]) {
  noStore();
  try {
    const { role } = await requireRole(['admin', 'vendedor', 'cliente']);
    const products = await prisma.product.findMany({
      where: { id: { in: ids } }
    });
    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
