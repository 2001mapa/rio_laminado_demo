const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// Fix expectedPrice in addPendingOrder
content = content.replace(
  `        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          sizeDetails: item.sizes,
        })),`,
  `        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          expectedPrice: item.product.price,
          sizeDetails: item.sizes,
        })),`
);

// Fix handleScan to fall back to IDB
const handleScanStr = `  const handleScan = async (sku: string) => {
    try {
      let product: Product | null = null;
      let error = '';

      if (navigator.onLine) {
        try {
           const result = await getExactProductBySku(sku);
           if (result.success && result.product) product = result.product as Product;
           else error = result.error || 'SKU no encontrado';
        } catch (e) {
           error = 'Error de red';
        }
      }

      if (!product && !navigator.onLine) {
        const offlineResults = await searchOfflineProducts(sku);
        const match = offlineResults.find(p => p.sku.toLowerCase() === sku.toLowerCase());
        if (match) {
          product = match as unknown as Product;
          addToast('Aviso: Mostrando catálogo offline. Inventario sujeto a confirmación.');
        } else {
          error = 'SKU no encontrado en modo offline';
        }
      }

      if (product) {
        setScannedProduct(product);
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
  };`;

content = content.replace(/const handleScan \= async \(sku\: string\) \=\> \{[\s\S]*?if \(scannerRef\.current\)/m, handleScanStr + '\n//');
// A bit of a hacky replace. Let's write a better script.
