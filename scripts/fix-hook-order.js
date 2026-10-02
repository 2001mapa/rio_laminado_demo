const fs = require('fs');

let pageContent = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

pageContent = pageContent.replace(
  `const { syncCatalog, isSyncing, lastSyncDate } = useCatalogSync(sellerId);\n`,
  ``
);

pageContent = pageContent.replace(
  `const [sellerId, setSellerId] = useState<string>('');`,
  `const [sellerId, setSellerId] = useState<string>('');\n  const { syncCatalog, isSyncing, lastSyncDate } = useCatalogSync(sellerId);`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', pageContent);
