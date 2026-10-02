const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. handleScan offline fallback
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
  };`;

content = content.replace(/const handleScan \= async \(sku\: string\) \=\> \{[\s\S]*?if \(scannerRef\.current\)\s*\{\s*try\s*\{\s*scannerRef\.current\.resume\(\)\;\s*\}\s*catch\(e\)\{\}\s*\}\s*\}\s*\};/m, handleScanStr);

// 2. Expected price in PendingOrder
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

// 3. UI Header
const oldHeader = `<div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-lg text-rio-ink">Escáner de Productos</h2>
              <button onClick={() => { stopScanner(); setStep(1); }} className="text-xs font-bold text-rio-gold-dark hover:underline">
                Cambiar Cliente
              </button>
            </div>`;

const newHeader = `<div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                 <h2 className="font-serif font-bold text-lg text-rio-ink">Escáner de Productos</h2>
                 <div className="flex items-center gap-2 mt-1">
                   <button onClick={syncCatalog} disabled={isSyncing} className="flex items-center gap-1 text-[11px] text-rio-gold-dark hover:text-rio-gold transition-colors font-medium bg-rio-gold/10 px-2 py-0.5 rounded">
                     <RefreshCw className={\`w-3 h-3 \${isSyncing ? 'animate-spin' : ''}\`} />
                     {isSyncing ? 'Sincronizando...' : 'Actualizar Catálogo'}
                   </button>
                   <span className="text-[10px] text-rio-muted">
                     {lastSyncDate ? \`Actualizado: \${new Date(lastSyncDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\` : 'No sincronizado'}
                   </span>
                 </div>
              </div>
              <button onClick={() => { stopScanner(); setStep(1); }} className="text-xs font-bold text-rio-gold-dark hover:underline">
                Cambiar Cliente
              </button>
            </div>`;

content = content.replace(oldHeader, newHeader);

// 4. offlineCustomers useEffect fix
const oldEffect = `  useEffect(() => {
    if (customers.length === 0) {
      searchOfflineCustomers('').then(res => setOfflineCustomers(res as any));
    }
  }, [customers]);`;

const newEffect = `  useEffect(() => {
    if (customers.length === 0 && sellerId) {
      searchOfflineCustomers('').then(res => setOfflineCustomers(res as any));
    }
  }, [customers, sellerId]);`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
