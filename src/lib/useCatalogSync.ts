import { useEffect, useState, useCallback } from 'react';
import { getSyncCatalog, getSyncCustomers } from '@/app/actions/sync';
import { getDB, CatalogProduct, CatalogCustomer, SyncMeta } from './offlineQueue';

export function useCatalogSync(sellerId?: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<number | null>(null);

  const loadMeta = useCallback(async (currentSellerId: string) => {
    const db = await getDB();
    if (db) {
      const meta = await db.get('sync_meta', 'products');
      const sellerMeta = await db.get('sync_meta', 'lastSellerId');
      if (meta && sellerMeta && sellerMeta.lastSyncedAt === currentSellerId) {
        setLastSyncDate(meta.lastSyncedAt as number);
      } else {
        setLastSyncDate(null);
      }
    }
  }, []);

  useEffect(() => {
    if (sellerId) {
      loadMeta(sellerId);
    } else {
      setLastSyncDate(null);
    }
  }, [sellerId, loadMeta]);

  const syncCatalog = useCallback(async () => {
    if (!sellerId || isSyncing || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    setIsSyncing(true);

    try {
      const db = await getDB();
      if (!db) return;

      const metaProd = await db.get('sync_meta', 'products');
      
      const lastSeller = await db.get('sync_meta', 'lastSellerId');
      if (lastSeller && lastSeller.lastSyncedAt !== sellerId) {
        await db.clear('catalog_products');
        await db.clear('catalog_customers');
        await db.clear('sync_meta');
        setLastSyncDate(null);
      }
      await db.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: sellerId, isComplete: true });
      
      let cursorProd: string | undefined = undefined;
      let hasMoreProd = true;
      let newSyncTime = Date.now();
      
      const allFetchedProducts: CatalogProduct[] = [];
      while (hasMoreProd) {
        const res = await getSyncCatalog(cursorProd, 200);
        if (!res.success) throw new Error('Error syncing catalog');
        
        for (const p of res.products) {
           allFetchedProducts.push(p as unknown as CatalogProduct);
        }
        cursorProd = res.nextCursor;
        hasMoreProd = res.hasMore;
      }
      
      let cursorCust: string | undefined = undefined;
      let hasMoreCust = true;
      
      const allFetchedCustomers: CatalogCustomer[] = [];
      while (hasMoreCust) {
        const res = await getSyncCustomers(cursorCust, 200);
        if (!res.success) throw new Error('Error syncing customers');
        
        for (const c of res.customers) {
           allFetchedCustomers.push(c as unknown as CatalogCustomer);
        }
        cursorCust = res.nextCursor;
        hasMoreCust = res.hasMore;
      }
      
      // Transaction to isolate write:
      // Clear old and put new data for BOTH stores
      const tx = db.transaction(['catalog_products', 'catalog_customers'], 'readwrite');
      await tx.objectStore('catalog_products').clear();
      for (const p of allFetchedProducts) {
        await tx.objectStore('catalog_products').put(p);
      }
      
      await tx.objectStore('catalog_customers').clear();
      for (const c of allFetchedCustomers) {
        await tx.objectStore('catalog_customers').put(c);
      }
      
      await tx.done;
      
      await db.put('sync_meta', { storeName: 'products', lastSyncedAt: newSyncTime, isComplete: true });
      await db.put('sync_meta', { storeName: 'customers', lastSyncedAt: newSyncTime, isComplete: true });
      
      setLastSyncDate(newSyncTime);
    } catch (error) {
      console.error('Catalog sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, sellerId]);

  return { isSyncing, lastSyncDate, syncCatalog };
}
