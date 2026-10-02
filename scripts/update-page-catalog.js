const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Add Imports
content = content.replace(
  `import { getExactProductBySku, getPagedCatalog, getProductsByIds } from '@/app/actions/queries';`,
  `import { getExactProductBySku, getPagedCatalog, getProductsByIds } from '@/app/actions/queries';\nimport { useCatalogSync } from '@/lib/useCatalogSync';\nimport { searchOfflineProducts, searchOfflineCustomers } from '@/lib/offlineQueue';`
);

// 2. Add hook call
content = content.replace(
  `const { customers, products, checkoutSeller, syncPendingOrders } = useDemo();`,
  `const { customers, products, checkoutSeller, syncPendingOrders } = useDemo();\n  const { syncCatalog, isSyncing, lastSyncDate } = useCatalogSync();\n  const [offlineCustomers, setOfflineCustomers] = useState<Customer[]>([]);`
);

// 3. Fallback customers
content = content.replace(
  `const [searchQuery, setSearchQuery] = useState('');`,
  `const [searchQuery, setSearchQuery] = useState('');\n  useEffect(() => {\n    if (customers.length === 0) {\n      searchOfflineCustomers('').then(res => setOfflineCustomers(res as any));\n    }\n  }, [customers]);\n  const effectiveCustomers = customers.length > 0 ? customers : offlineCustomers;`
);

content = content.replace(/customers\.filter/g, `effectiveCustomers.filter`);
content = content.replace(/customers\.find/g, `effectiveCustomers.find`);
content = content.replace(/customers\.length/g, `effectiveCustomers.length`);

// 4. Update handleScan to use offline logic
content = content.replace(
  `const handleScan = async (sku: string) => {
    try {
      const result = await getExactProductBySku(sku);
      
      if (result.success && result.product) {`,
  `const handleScan = async (sku: string) => {
    try {
      let product = null;
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
           const result = await getExactProductBySku(sku);
           if (result.success && result.product) product = result.product;
        } catch(e) {}
      }
      if (!product) {
        const offlineList = await searchOfflineProducts(sku);
        product = offlineList.find(p => p.sku.toLowerCase() === sku.toLowerCase()) || null;
      }
      
      if (product) {`
);

// 5. Add UI for sync status in the Scanner section
const scannerSection = `        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-rio-ink">Escáner de Productos</h2>`;
const newScannerSection = `        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-rio-ink">Escáner de Productos</h2>
          <div className="text-xs text-rio-ink/60 flex items-center gap-2">
            {lastSyncDate ? \`Catálogo: \${new Date(lastSyncDate).toLocaleTimeString()}\` : 'Catálogo no descargado'}
            <button onClick={syncCatalog} disabled={isSyncing} className="p-1 rounded bg-rio-surface border border-rio-cloud hover:bg-rio-cloud/50">
               <RefreshCw className={\`w-3 h-3 \${isSyncing ? 'animate-spin' : ''}\`} />
            </button>
          </div>`;
content = content.replace(scannerSection, newScannerSection);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
