import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCatalogSync } from '@/lib/useCatalogSync';
import * as syncActions from '@/app/actions/sync';
import { getDB } from '@/lib/offlineQueue';

vi.mock('@/app/actions/sync', () => ({
  getSyncCatalog: vi.fn(),
  getSyncCustomers: vi.fn()
}));

describe('Phase 5: Catalog Sync', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await getDB();
    if (db) {
      await db.clear('sync_meta');
      await db.clear('catalog_products');
      await db.clear('catalog_customers');
    }
  });

  it('debe abortar si se interrumpe y no borrar el catálogo previo', async () => {
    const db = await getDB();
    await db!.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: 'seller-a', isComplete: true });
    await db!.put('catalog_products', { id: 'p1', sku: 'OLD-1' } as any);

    vi.mocked(syncActions.getSyncCatalog).mockRejectedValueOnce(new Error('Network error'));

    renderHook(() => useCatalogSync('seller-a'));
    
    await act(async () => {
      await new Promise(r => setTimeout(r, 100)); 
    });

    const oldProd = await db!.get('catalog_products', 'p1');
    expect(oldProd).toBeDefined();
    expect(oldProd?.sku).toBe('OLD-1');
  });

  it('debe aislar y limpiar clientes de cuenta previa (A->B)', async () => {
    const db = await getDB();
    await db!.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: 'seller-a', isComplete: true });
    await db!.put('catalog_products', { id: 'p1', sku: 'OLD-1' } as any);
    await db!.put('catalog_customers', { id: 'c1', name: 'Cliente A' } as any);

    vi.mocked(syncActions.getSyncCatalog).mockImplementation(async () => ({ success: true, products: [], hasMore: false, nextCursor: undefined }));
    vi.mocked(syncActions.getSyncCustomers).mockImplementation(async () => ({ success: true, customers: [], hasMore: false, nextCursor: undefined }));

    renderHook(() => useCatalogSync('seller-b'));
    
    await act(async () => {
      await new Promise(r => setTimeout(r, 100)); 
    });

    const oldCust = await db!.get('catalog_customers', 'c1');
    expect(oldCust).toBeUndefined();
    const lastSeller = await db!.get('sync_meta', 'lastSellerId');
    expect(lastSeller?.lastSyncedAt).toBe('seller-b');
  });
});
