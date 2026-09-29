const fs = require('fs');

const code = `
export async function getOrderById(id: string) {
  noStore();
  try {
    const { role, user } = await requireRole(['admin', 'vendedor', 'cliente']);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        items: { include: { product: true } }, 
        customer: true, 
        seller: true, 
        groups: { include: { items: true } },
        history: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!order) return { success: false, message: 'Pedido no encontrado' };

    // Security check
    if (role === 'vendedor') {
       const sellerProfile = await prisma.seller.findUnique({ where: { authUserId: user.id } });
       if (order.sellerId !== sellerProfile?.id) {
           return { success: false, message: 'Acceso denegado a este pedido' };
       }
    } else if (role === 'cliente') {
       const customerProfile = await prisma.customer.findUnique({ where: { authUserId: user.id } });
       if (order.customerId !== customerProfile?.id) {
           return { success: false, message: 'Acceso denegado a este pedido' };
       }
    }

    return { success: true, order };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
`;

const ordersPath = 'src/app/actions/orders.ts';
let ordersCode = fs.readFileSync(ordersPath, 'utf8');

// Ensure noStore is imported if needed, otherwise rely on Next cache behavior or unstable_noStore
if (!ordersCode.includes('unstable_noStore')) {
    ordersCode = `import { unstable_noStore as noStore } from 'next/cache';\n` + ordersCode;
}

ordersCode += code;
fs.writeFileSync(ordersPath, ordersCode);
console.log('Added getOrderById');
