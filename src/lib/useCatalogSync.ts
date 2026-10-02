import { useEffect, useState, useCallback } from 'react';
import { getSyncCatalog, getSyncCustomers } from '@/app/actions/sync';
import { getDB, CatalogProduct, CatalogCustomer, SyncMeta } from './offlineQueue';

export function useCatalogSync(sellerId?: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<number | null>(null);

  const loadMeta = async () => {
    const db = await getDB();
    if (db) {
      const meta = await db.get('sync_meta', 'products');
      if (meta) setLastSyncDate(meta.lastSyncedAt as number);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  const syncCatalog = useCallback(async () => {
    if (isSyncing || typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSyncing(true);

    try {
      const db = await getDB();
      if (!db) return;

      const metaProd = await db.get('sync_meta', 'products');
      
      // Evita que datos de clientes de una cuenta queden visibles para otra en dispositivo compartido
      if (sellerId) {
        const lastSeller = await db.get('sync_meta', 'lastSellerId');
        if (lastSeller && lastSeller.lastSyncedAt !== sellerId) {
          await db.clear('catalog_products');
          await db.clear('catalog_customers');
          await db.clear('sync_meta');
        }
        await db.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: sellerId, isComplete: true });
      }
      
      let lastProdSync = metaProd ? metaProd.lastSyncedAt : 0;

      
      let cursorProd: string | undefined = undefined;
      let hasMoreProd = true;
      let newProdSyncTime = Date.now();
      let fetchedProductIds = new Set<string>();
      
      while (hasMoreProd) {
        const res = await getSyncCatalog(cursorProd, 200);
        if (!res.success) throw new Error('Error syncing catalog');
        
        const tx = db.transaction('catalog_products', 'readwrite');
        for (const p of res.products) {
           fetchedProductIds.add(p.id);
           await tx.store.put(p as unknown as CatalogProduct);
        }
        await tx.done;
        
        cursorProd = res.nextCursor;
        hasMoreProd = res.hasMore;
      }
      
      // Eliminar productos que ya no existen en el servidor
      const allProductKeys = await db.getAllKeys('catalog_products');
      const txDeleteProd = db.transaction('catalog_products', 'readwrite');
      for (const key of allProductKeys) {
         if (!fetchedProductIds.has(key as string)) {
             await txDeleteProd.store.delete(key);
         }
      }
      await txDeleteProd.done;
      
      await db.put('sync_meta', { storeName: 'products', lastSyncedAt: newProdSyncTime, isComplete: true });

      const metaCust = await db.get('sync_meta', 'customers');
      let lastCustSync = metaCust ? metaCust.lastSyncedAt : 0;
      
      let cursorCust: string | undefined = undefined;
      let hasMoreCust = true;
      let newCustSyncTime = Date.now();
      let fetchedCustomerIds = new Set<string>();
      
      while (hasMoreCust) {
        const res = await getSyncCustomers(cursorCust, 200);
        if (!res.success) throw new Error('Error syncing customers');
        
        const tx = db.transaction('catalog_customers', 'readwrite');
        for (const c of res.customers) {
           fetchedCustomerIds.add(c.id);
           await tx.store.put(c as unknown as CatalogCustomer);
        }
        await tx.done;
        
        cursorCust = res.nextCursor;
        hasMoreCust = res.hasMore;
      }
      
      const allCustomerKeys = await db.getAllKeys('catalog_customers');
      const txDeleteCust = db.transaction('catalog_customers', 'readwrite');
      for (const key of allCustomerKeys) {
         if (!fetchedCustomerIds.has(key as string)) {
             await txDeleteCust.store.delete(key);
         }
      }
      await txDeleteCust.done;
      
      await db.put('sync_meta', { storeName: 'customers', lastSyncedAt: newCustSyncTime, isComplete: true });
      
      setLastSyncDate(newProdSyncTime);

    } catch (err) {
      console.error("Failed to sync offline catalog", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    const handleFocus = () => { syncCatalog(); };
    window.addEventListener('focus', handleFocus);
    syncCatalog();
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return { syncCatalog, isSyncing, lastSyncDate };
}
