const fs = require('fs');

let content = fs.readFileSync('src/lib/useCatalogSync.ts', 'utf8');

content = content.replace(
  `      let newProdSyncTime = Date.now();
      
      while (hasMoreProd) {`,
  `      let newProdSyncTime = Date.now();
      let fetchedProductIds = new Set<string>();
      
      while (hasMoreProd) {`
);

content = content.replace(
  `for (const p of res.products) {
           await tx.store.put(p as unknown as CatalogProduct);
        }`,
  `for (const p of res.products) {
           fetchedProductIds.add(p.id);
           await tx.store.put(p as unknown as CatalogProduct);
        }`
);

content = content.replace(
  `await db.put('sync_meta', { storeName: 'products', lastSyncedAt: newProdSyncTime, isComplete: true });`,
  `// Eliminar productos que ya no existen en el servidor
      const allProductKeys = await db.getAllKeys('catalog_products');
      const txDeleteProd = db.transaction('catalog_products', 'readwrite');
      for (const key of allProductKeys) {
         if (!fetchedProductIds.has(key as string)) {
             await txDeleteProd.store.delete(key);
         }
      }
      await txDeleteProd.done;
      
      await db.put('sync_meta', { storeName: 'products', lastSyncedAt: newProdSyncTime, isComplete: true });`
);

// Do the same for customers
content = content.replace(
  `      let cursorCust: string | undefined = undefined;
      let hasMoreCust = true;
      let newCustSyncTime = Date.now();
      
      while (hasMoreCust) {`,
  `      let cursorCust: string | undefined = undefined;
      let hasMoreCust = true;
      let newCustSyncTime = Date.now();
      let fetchedCustomerIds = new Set<string>();
      
      while (hasMoreCust) {`
);

content = content.replace(
  `for (const c of res.customers) {
           await tx.store.put(c as unknown as CatalogCustomer);
        }`,
  `for (const c of res.customers) {
           fetchedCustomerIds.add(c.id);
           await tx.store.put(c as unknown as CatalogCustomer);
        }`
);

content = content.replace(
  `await db.put('sync_meta', { storeName: 'customers', lastSyncedAt: newCustSyncTime, isComplete: true });`,
  `const allCustomerKeys = await db.getAllKeys('catalog_customers');
      const txDeleteCust = db.transaction('catalog_customers', 'readwrite');
      for (const key of allCustomerKeys) {
         if (!fetchedCustomerIds.has(key as string)) {
             await txDeleteCust.store.delete(key);
         }
      }
      await txDeleteCust.done;
      
      await db.put('sync_meta', { storeName: 'customers', lastSyncedAt: newCustSyncTime, isComplete: true });`
);

fs.writeFileSync('src/lib/useCatalogSync.ts', content);
