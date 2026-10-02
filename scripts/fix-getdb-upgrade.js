const fs = require('fs');
let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');

const correctUpgrade = `      dbPromise = openDB<RioDB>('rio-offline-db', 3, {
        upgrade(db, oldVersion, newVersion, transaction) {
          if (!db.objectStoreNames.contains('drafts')) {
            db.createObjectStore('drafts', { keyPath: 'sellerId' });
          }
          if (!db.objectStoreNames.contains('pending_orders')) {
            const store = db.createObjectStore('pending_orders', { keyPath: 'clientRequestId' });
            store.createIndex('by-seller', 'sellerId');
          }
          if (!db.objectStoreNames.contains('catalog_products')) {
            const prodStore = db.createObjectStore('catalog_products', { keyPath: 'id' });
            prodStore.createIndex('by-sku', 'sku');
          }
          if (!db.objectStoreNames.contains('catalog_customers')) {
            db.createObjectStore('catalog_customers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sync_meta')) {
            db.createObjectStore('sync_meta', { keyPath: 'storeName' });
          }
        },
      });`;

content = content.replace(/dbPromise \= openDB\<RioDB\>\('rio-offline-db', 3, \{[\s\S]*?\}\,\s*\}\)\;/m, correctUpgrade);

fs.writeFileSync('src/lib/offlineQueue.ts', content);
