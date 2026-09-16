import { PrismaClient } from '@prisma/client';
import { initialProducts, initialCustomers, initialSellers } from './src/lib/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Sellers
  for (const seller of initialSellers) {
    await prisma.seller.upsert({
      where: { email: seller.email },
      update: {},
      create: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        status: seller.status,
      },
    });
  }

  // Create Customers
  for (const customer of initialCustomers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        discount: customer.discount,
        showDiscount: customer.showDiscount,
        status: customer.status,
      },
    });
  }

  // Create Products
  for (const product of initialProducts) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: (product as any).stock || (product.lowStock ? 3 : 25),
        imageUrl: product.image,
        locationCode: product.locationCode,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
