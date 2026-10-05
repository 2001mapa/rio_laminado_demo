import { describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import {
  clearOfflineSellerAccess,
  getDB,
  getOfflineSellerAccess,
  recordOfflineSellerAccess,
  OFFLINE_ACCESS_MAX_AGE_MS,
} from '@/lib/offlineQueue';

describe('acceso local para ventas sin conexión', () => {
  it('conserva el catálogo de una instalación anterior y solo permite a su vendedor', async () => {
    const db = await getDB();
    expect(db).not.toBeNull();
    if (!db) return;
    await db.put('catalog_products', {
      id: 'ring-1', sku: 'R-1', name: 'Anillo', material: null,
      category: 'Anillos', price: 10, physicalStock: 2,
      reservedStock: 0, isActive: true,
    });
    await db.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: 'seller-a', isComplete: true });
    await db.put('sync_meta', { storeName: 'products', lastSyncedAt: Date.now(), isComplete: true });
    await db.put('sync_meta', { storeName: 'customers', lastSyncedAt: Date.now(), isComplete: true });
    await recordOfflineSellerAccess('seller-a');
    expect((await getOfflineSellerAccess())?.sellerId).toBe('seller-a');
    expect((await db.get('catalog_products', 'ring-1'))?.sku).toBe('R-1');

    await db.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: 'seller-b', isComplete: true });
    expect(await getOfflineSellerAccess()).toBeNull();
    await db.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: 'seller-a', isComplete: true });
    await db.put('offline_access', { key: 'seller', sellerId: 'seller-a', verifiedAt: Date.now() - OFFLINE_ACCESS_MAX_AGE_MS - 1 });
    expect(await getOfflineSellerAccess()).toBeNull();
    await clearOfflineSellerAccess();
    expect(await getOfflineSellerAccess()).toBeNull();
  });
});
