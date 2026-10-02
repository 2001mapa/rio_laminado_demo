const fs = require('fs');
let content = fs.readFileSync('src/lib/useCatalogSync.ts', 'utf8');

content = content.replace(
  `export function useCatalogSync() {`,
  `export function useCatalogSync(sellerId?: string) {`
);

content = content.replace(
  `let lastProdSync = metaProd ? metaProd.lastSyncedAt : 0;`,
  `
      // Evita que datos de clientes de una cuenta queden visibles para otra en dispositivo compartido
      if (sellerId) {
        const lastSeller = await db.get('sync_meta', 'lastSellerId');
        if (lastSeller && lastSeller.lastSyncedAt !== (sellerId as any)) {
          await db.clear('catalog_products');
          await db.clear('catalog_customers');
          await db.clear('sync_meta');
        }
        await db.put('sync_meta', { storeName: 'lastSellerId', lastSyncedAt: sellerId as any, isComplete: true });
      }
      
      let lastProdSync = metaProd ? metaProd.lastSyncedAt : 0;
`
);

fs.writeFileSync('src/lib/useCatalogSync.ts', content);

let pageContent = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');
pageContent = pageContent.replace(
  `const { syncCatalog, isSyncing, lastSyncDate } = useCatalogSync();`,
  `const { syncCatalog, isSyncing, lastSyncDate } = useCatalogSync(sellerId);`
);
fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', pageContent);
