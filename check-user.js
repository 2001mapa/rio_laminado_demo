const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const seller = await prisma.seller.findFirst({ where: { email: '2001mapa@gmail.com' } });
  const customer = await prisma.customer.findFirst({ where: { email: '2001mapa@gmail.com' } });
  console.log('Seller:', seller);
  console.log('Customer:', customer);
}
check();
