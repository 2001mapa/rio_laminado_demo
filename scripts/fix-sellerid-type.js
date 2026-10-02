const fs = require('fs');

let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');
content = content.replace(
  `lastSyncedAt: number;`,
  `lastSyncedAt: number | string;`
);
fs.writeFileSync('src/lib/offlineQueue.ts', content);

let syncContent = fs.readFileSync('src/lib/useCatalogSync.ts', 'utf8');
syncContent = syncContent.replace(
  `lastSyncedAt !== (sellerId as any)`,
  `lastSyncedAt !== sellerId`
);
syncContent = syncContent.replace(
  `lastSyncedAt: sellerId as any`,
  `lastSyncedAt: sellerId`
);

// Fix pagination "no marques el catálogo como completo tras una descarga parcial"
// We need to loop with cursor until hasMore is false, and ONLY THEN set isComplete: true.
// Actually, the loop does exactly this:
// while (hasMoreProd) { ... }
// await db.put('sync_meta', { storeName: 'products', lastSyncedAt: newProdSyncTime, isComplete: true });
// This is already correct! If it throws an error in the middle of the loop, it won't reach the db.put!

fs.writeFileSync('src/lib/useCatalogSync.ts', syncContent);
