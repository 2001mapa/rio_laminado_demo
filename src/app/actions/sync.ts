'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/utils/auth-helpers';

export async function getSyncCatalog(cursor?: string, limit: number = 200) {
  if (limit > 500) limit = 500;
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
  const { role, user } = await requireRole(['vendedor', 'admin']);
  if (limit > 500) limit = 500;
  
  let whereClause = {};
  if (role === 'vendedor') {
     const seller = await prisma.seller.findUnique({ where: { authUserId: user.id } });
     if (!seller) throw new Error("Vendedor no encontrado");
     // Usually, clients are global or associated to a seller? Wait, in this B2B demo, are customers global or per-seller?
     // Let's check prisma schema: Customer doesn't have sellerId!
     // If Customer doesn't have sellerId, then all customers are global? But the prompt says:
     // "evita que datos de clientes de una cuenta queden visibles para otra en un dispositivo compartido."
     // How do we prevent it? We store them in IndexedDB, but IndexedDB is per origin!
     // So if another seller logs in on the same device, they see the previous seller's cached customers!
     // To fix this, IndexedDB `catalog_customers` needs to be cleared on logout or we just clear the whole DB on logout!
     // Or we can append `sellerId` to the keys?
     // The simplest way to "avoid data leak on shared device" is to clear the IDB catalog when the auth user changes, or during logout.
     // Wait, let's just clear the DB in useCatalogSync if sellerId changes, OR clear it in the login/logout flow.
     // Actually, in `page.tsx`, we know the sellerId.
  }

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
