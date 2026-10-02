const fs = require('fs');
let lines = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8').split('\n');

const scannerHeaderIndex = lines.findIndex(l => l.includes('Esc') && l.includes('ner de Productos') && l.includes('text-lg font-bold'));

if (scannerHeaderIndex !== -1) {
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
    
    let startDiv = scannerHeaderIndex;
    while (!lines[startDiv].includes('<div className="p-4 bg-white z-10 flex flex-col shadow-sm">') && startDiv > 0) startDiv--;
    
    let endDiv = scannerHeaderIndex;
    while (!lines[endDiv].includes('<form') && endDiv < lines.length) endDiv++;
    
    lines.splice(startDiv, endDiv - startDiv, ...headerReplacement);
} else {
    console.log("Scanner header not found");
}

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', lines.join('\n'));
