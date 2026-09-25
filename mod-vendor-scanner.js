const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// Add import
if (!code.includes('getPagedCatalog')) {
  code = code.replace(/import \{ formatPrice \} from '@\/lib\/utils';/, "import { formatPrice } from '@/lib/utils';\nimport { getPagedCatalog } from '@/app/actions/queries';");
}

// Modify handleScan
const newHandleScan = `
  const handleScan = async (sku: string) => {
    try {
      const result = await getPagedCatalog({ search: sku, limit: 1 });
      const product = result.products.find(p => p.sku === sku);
      
      if (product) {
        setScannedProduct(product);
        setScanQuantity(1);
        try {
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          audio.volume = 0.5;
          audio.play();
        } catch(e) {}
      } else {
        addToast(\`SKU no encontrado: \${sku}\`);
        if (scannerRef.current) scannerRef.current.resume();
      }
    } catch (err) {
      addToast('Error al buscar el producto');
      if (scannerRef.current) scannerRef.current.resume();
    }
  };
`;

code = code.replace(/const handleScan = \(sku: string\) => \{[\s\S]*?if \(scannerRef\.current\) scannerRef\.current\.resume\(\);\s*\}\s*\};/, newHandleScan);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed vendor scanner');
