import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchOfflineProducts, searchOfflineCustomers, getOfflineProductsByIds, getDB } from '@/lib/offlineQueue';

describe('Phase 5: Offline Seller Isolation', () => {
  beforeEach(async () => {
    // Clear and reset DB
    const db = await getDB();
    if (db) {
      const tx = db.transaction(['sync_meta', 'catalog_products', 'catalog_customers'], 'readwrite');
      await tx.objectStore('sync_meta').clear();
      await tx.objectStore('catalog_products').clear();
      await tx.objectStore('catalog_customers').clear();
      
      await tx.objectStore('sync_meta').put({ storeName: 'lastSellerId', lastSyncedAt: 'seller-a', isComplete: true });
      await tx.objectStore('catalog_products').put({ id: 'p1', sku: 'ANILLO-01', name: 'Anillo', isActive: true, category: 'Anillos', price: 100 } as any);
      await tx.objectStore('catalog_customers').put({ id: 'c1', name: 'Cliente Fiel', status: 'active' } as any);
      await tx.done;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debe devolver productos si el sellerId coincide con el propietario del catálogo', async () => {
    const products = await searchOfflineProducts('anillo', 'seller-a');
    expect(products.length).toBe(1);
    expect(products[0].sku).toBe('ANILLO-01');
  });

  it('debe devolver vacío (fail closed) si el sellerId no coincide', async () => {
    const products = await searchOfflineProducts('anillo', 'seller-b');
    expect(products.length).toBe(0);
  });

  it('debe devolver vacío (fail closed) si no se provee sellerId', async () => {
    const products = await searchOfflineProducts('anillo', '');
    expect(products.length).toBe(0);
  });

  it('clientes offline: debe devolver vacío si el sellerId no coincide', async () => {
    const customers = await searchOfflineCustomers('cliente', 'seller-b');
    expect(customers.length).toBe(0);
    const validCustomers = await searchOfflineCustomers('cliente', 'seller-a');
    expect(validCustomers.length).toBe(1);
  });
});
