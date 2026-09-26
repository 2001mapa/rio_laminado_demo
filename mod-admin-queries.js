const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

// Update getAppData for Admin to not load all orders
code = code.replace(
  /orders = await prisma\.order\.findMany\(\{\s*include: \{ items: \{ include: \{ product: true \} \}, customer: true, seller: true, groups: \{ include: \{ items: true \} \} \},\s*orderBy: \{ createdAt: 'desc' \}\s*\}\);/,
  `orders = await prisma.order.findMany({
          where: { status: { notIn: ['Despachado', 'Cancelado'] } },
          take: 100,
          include: { items: { include: { product: true } }, customer: true, seller: true, groups: { include: { items: true } } },
          orderBy: { createdAt: 'desc' }
        });`
);

// Append getAdminStats and getPagedAdminOrders
const adminQueries = `
export async function getAdminStats() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };

    // Dashboard needs:
    // newOrders: Reservado | Confirmado
    // inPrepOrders: En preparación
    // pendingVerify: Pendiente de verificación
    // verifiedOrders: Verificado | Empacado
    // totalOrders, totalUnitsSold (last 30 days?), urgentOrders (En preparación > 2 days)
    
    // Low stock / Out of stock
    const products = await prisma.product.findMany({
      select: { physicalStock: true, reservedStock: true, isActive: true }
    });
    
    const lowStockCount = products.filter(p => p.isActive && (p.physicalStock - p.reservedStock) <= 3 && (p.physicalStock - p.reservedStock) > 0).length;
    const outOfStockCount = products.filter(p => p.isActive && (p.physicalStock - p.reservedStock) <= 0).length;

    // Count orders by status
    const groupCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });

    const counts: Record<string, number> = {};
    for (const gc of groupCounts) {
      counts[gc.status] = gc._count;
    }

    // Get urgent orders (En preparación, > 2 days ago)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const urgentOrders = await prisma.order.count({
      where: {
        status: 'En preparación',
        createdAt: { lte: twoDaysAgo }
      }
    });

    const newOrders = (counts['Reservado'] || 0) + (counts['Confirmado'] || 0);
    const inPrepOrders = counts['En preparación'] || 0;
    const pendingVerify = counts['Pendiente de verificación'] || 0;
    const verifiedOrders = (counts['Verificado'] || 0) + (counts['Empacado'] || 0);
    const validOrdersCount = await prisma.order.count({ where: { status: { not: 'Cancelado' } } });

    return {
      success: true,
      stats: {
        newOrders,
        inPrepOrders,
        pendingVerify,
        verifiedOrders,
        urgentOrders,
        validOrdersCount,
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
`;

if (!code.includes('getPagedAdminOrders')) {
  code += adminQueries;
  fs.writeFileSync('src/app/actions/queries.ts', code);
  console.log('Appended admin queries successfully');
} else {
  console.log('Admin queries already exist');
}
