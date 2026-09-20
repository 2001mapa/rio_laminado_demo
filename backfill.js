const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { physicalStock: p.stock }
    });
  }
  console.log('Backfill complete for', products.length, 'products');
}

main().catch(console.error).finally(() => prisma.$disconnect());
