const fs = require('fs');
let lines = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8').split('\n');

const handleScanStart = lines.findIndex(l => l.includes('const handleScan = async (sku: string) => {'));
const confirmScanStart = lines.findIndex(l => l.includes('const confirmScan = () => {'));

if (handleScanStart !== -1 && confirmScanStart !== -1) {
  const handleScanStr = `  const handleScan = async (sku: string) => {
    try {
      let product: any = null;
      let error = '';

      if (navigator.onLine) {
        try {
           const result = await getExactProductBySku(sku);
           if (result.success && result.product) product = result.product;
           else error = result.error || 'SKU no encontrado';
        } catch (e) {
           error = 'Error de red';
        }
      }

      // Fallback offline
      if (!product) {
        const offlineResults = await searchOfflineProducts(sku);
        const match = offlineResults.find((p: any) => p.sku.toLowerCase() === sku.toLowerCase());
        if (match) {
          product = match;
          addToast(!navigator.onLine ? 'Modo offline: Stock y precio sujetos a confirmación.' : 'Aviso: Falló la red. Mostrando catálogo local sujeto a confirmación.');
        } else {
          error = !navigator.onLine ? 'SKU no encontrado en catálogo offline' : (error || 'SKU no encontrado');
        }
      }

      if (product) {
        setScannedProduct(product as Product);
        setScanQuantity(1);
        setScanSizes([]);
        setScanSizeInput('');
        setScanSizeQtyInput(1);
        try {
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          audio.volume = 0.5;
          audio.play();
        } catch(e) {}
      } else {
        addToast(error || \`SKU no encontrado: \${sku}\`);
        if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
      }
    } catch (err) {
      addToast('Error al procesar el escaneo');
      if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
    }
  };

`.split('\n');

  lines.splice(handleScanStart, confirmScanStart - handleScanStart, ...handleScanStr);
  fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', lines.join('\n'));
}
