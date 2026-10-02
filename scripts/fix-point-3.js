const fs = require('fs');

let lines = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8').split('\n');

const handleScanStart = lines.findIndex(l => l.includes('const handleScan = async (sku: string) => {'));
let handleScanEnd = handleScanStart;
let bracketCount = 0;
let started = false;

for (let i = handleScanStart; i < lines.length; i++) {
  if (lines[i].includes('{')) {
    bracketCount += (lines[i].match(/\{/g) || []).length;
    started = true;
  }
  if (lines[i].includes('}')) {
    bracketCount -= (lines[i].match(/\}/g) || []).length;
  }
  if (started && bracketCount === 0) {
    handleScanEnd = i;
    break;
  }
}

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
        const match = offlineResults.find(p => p.sku.toLowerCase() === sku.toLowerCase());
        if (match) {
          product = match;
          addToast(!navigator.onLine ? 'Modo offline: Stock y precio sujetos a confirmación.' : 'Aviso: Falló la red. Mostrando catálogo local sujeto a confirmación.');
        } else {
          error = !navigator.onLine ? 'SKU no encontrado en catálogo offline' : (error || 'SKU no encontrado');
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
  };`.split('\n');

lines.splice(handleScanStart, handleScanEnd - handleScanStart + 1, ...handleScanStr);

// Now fix expectedPrice in PendingOrder
const addPendingOrderIndex = lines.findIndex(l => l.includes('const pendingOrder: PendingOrder = {'));
if (addPendingOrderIndex !== -1) {
    for (let i = addPendingOrderIndex; i < addPendingOrderIndex + 20; i++) {
        if (lines[i].includes('sizeDetails: item.sizes,')) {
            lines.splice(i, 0, '          expectedPrice: item.product.price,');
            break;
        }
    }
}

// Now UI for lastSyncDate "Muestra la fecha de sincronización y el botón manual prometidos."
// Let's add it right above the scanner or in the header of the Escáner section
const scannerHeaderIndex = lines.findIndex(l => l.includes('Escáner de Productos') && l.includes('text-lg font-bold'));
if (scannerHeaderIndex !== -1) {
    // Modify the header div
    const headerReplacement = `              <div className="p-4 bg-white z-10 flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-rio-ink font-serif tracking-tight">Escáner de Productos</h2>
                  <div className="flex flex-col items-end">
                    <button onClick={syncCatalog} disabled={isSyncing} className="flex items-center gap-1 text-xs text-rio-gold-dark hover:text-rio-gold transition-colors">
                      <RefreshCw className={\`w-3 h-3 \${isSyncing ? 'animate-spin' : ''}\`} />
                      {isSyncing ? 'Sincronizando...' : 'Actualizar Catálogo'}
                    </button>
                    <span className="text-[10px] text-rio-muted">
                      {lastSyncDate ? \`Última act: \${new Date(lastSyncDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\` : 'Catálogo no sincronizado'}
                    </span>
                  </div>
                </div>`.split('\n');
    
    // find the <div> containing the header
    let startDiv = scannerHeaderIndex;
    while (!lines[startDiv].includes('<div className="p-4 bg-white z-10 flex flex-col shadow-sm">') && startDiv > 0) startDiv--;
    
    let endDiv = scannerHeaderIndex;
    while (!lines[endDiv].includes('<form') && endDiv < lines.length) endDiv++;
    
    lines.splice(startDiv, endDiv - startDiv, ...headerReplacement);
}

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', lines.join('\n'));
