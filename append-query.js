const fs = require('fs');
let text = fs.readFileSync('src/app/actions/queries.ts', 'utf8');
text += `
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
`;
fs.writeFileSync('src/app/actions/queries.ts', text);
