const fs = require('fs');
const file = 'src/app/actions/queries.ts';
let code = fs.readFileSync(file, 'utf8');

const getAppDataReplacement = \export async function getAppData() {
  noStore();
  try {
    const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
    
    // Todos pueden ver el catálogo activo
    const products = role === 'admin' ? await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }) : [];

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
        take: 100
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
}\;

code = code.replace(/export async function getAppData\(\) \\{[\\s\\S]*?\\n\\}\\n/, getAppDataReplacement + '\\n');

const newFunctions = \
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

    return {
      success: true,
      orders,
      hasMore,
      nextCursor
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
\;

code += newFunctions;
fs.writeFileSync(file, code);

