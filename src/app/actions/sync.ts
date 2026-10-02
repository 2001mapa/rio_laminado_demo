'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/utils/auth-helpers';

export async function getSyncCatalog(cursor?: string, limit: number = 200) {
  await requireRole(['vendedor', 'admin']);
  
  const products = await prisma.product.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      sku: true,
      name: true,
      material: true,
      category: true,
      price: true,
      physicalStock: true,
      reservedStock: true,
      isActive: true,
      imageUrl: true,
    }
  });

  const nextCursor = products.length === limit ? products[limit - 1].id : undefined;

  return {
    success: true,
    products,
    nextCursor,
    hasMore: products.length === limit
  };
}

export async function getSyncCustomers(cursor?: string, limit: number = 200) {
  await requireRole(['vendedor', 'admin']);
  
  const customers = await prisma.customer.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true
    }
  });

  const nextCursor = customers.length === limit ? customers[limit - 1].id : undefined;

  return {
    success: true,
    customers,
    nextCursor,
    hasMore: customers.length === limit
  };
}
