const fs = require('fs');

let pageContent = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');
pageContent = pageContent.replace(
  `setSelectedCustomer(cust);`,
  `setSelectedCustomer(cust || null);`
);
// replace multiple occurrences if necessary
pageContent = pageContent.replace(
  /setSelectedCustomer\(cust\);/g,
  `setSelectedCustomer(cust || null);`
);
fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', pageContent);

let syncContent = fs.readFileSync('src/lib/useCatalogSync.ts', 'utf8');
syncContent = syncContent.replace(
  `if (meta) setLastSyncDate(meta.lastSyncedAt);`,
  `if (meta) setLastSyncDate(meta.lastSyncedAt as number);`
);
fs.writeFileSync('src/lib/useCatalogSync.ts', syncContent);
