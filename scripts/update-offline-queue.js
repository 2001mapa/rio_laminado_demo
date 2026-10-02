const fs = require('fs');

let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');

// 1. Update PendingOrder status type
content = content.replace(
  `status: 'pending' | 'syncing' | 'failed_recoverable' | 'failed_fatal' | 'failed_intervention';`,
  `status: 'pending' | 'syncing' | 'failed_recoverable' | 'failed_fatal' | 'failed_intervention' | 'conflict';\n  conflicts?: { productId?: string; reason: string; currentStock?: number; currentPrice?: number }[];`
);

// 2. Add Catalog Interfaces
const catalogInterfaces = `
export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  material: string | null;
  category: string;
  price: number;
  physicalStock: number;
  reservedStock: number;
  isActive: boolean;
  updatedAt: number;
  imageUrl?: string | null;
}

export interface CatalogCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  updatedAt: number;
  isActive: boolean;
}

export interface SyncMeta {
  storeName: string;
  lastSyncedAt: number;
  isComplete: boolean;
}
`;

content = content.replace('interface RioDB extends DBSchema {', catalogInterfaces + '\ninterface RioDB extends DBSchema {');

// 3. Update RioDB interface
const rioDBStores = `    catalog_products: {
      key: string;
      value: CatalogProduct;
      indexes: { 'by-sku': string };
    };
    catalog_customers: {
      key: string;
      value: CatalogCustomer;
    };
    sync_meta: {
      key: string;
      value: SyncMeta;
    };`;

content = content.replace(
  `    pending_orders: {
      key: string;
      value: PendingOrder;
      indexes: { 'by-seller': string };
    };
  }`,
  `    pending_orders: {
      key: string;
      value: PendingOrder;
      indexes: { 'by-seller': string };
    };\n${rioDBStores}
  }`
);

// 4. Update getDB function
content = content.replace(`openDB<RioDB>('rio-offline-db', 2, {`, `openDB<RioDB>('rio-offline-db', 3, {`);

const newStoresInit = `          if (!db.objectStoreNames.contains('catalog_products')) {
            const prodStore = db.createObjectStore('catalog_products', { keyPath: 'id' });
            prodStore.createIndex('by-sku', 'sku');
          }
          if (!db.objectStoreNames.contains('catalog_customers')) {
            db.createObjectStore('catalog_customers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sync_meta')) {
            db.createObjectStore('sync_meta', { keyPath: 'storeName' });
          }`;

content = content.replace(
  `store.createIndex('by-seller', 'sellerId');
          }`,
  `store.createIndex('by-seller', 'sellerId');
          }\n${newStoresInit}`
);

fs.writeFileSync('src/lib/offlineQueue.ts', content);
