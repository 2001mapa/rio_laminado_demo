const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between mb-4">\s*<h2 className="font-serif font-bold text-lg text-rio-ink">Esc.ner de Productos<\/h2>\s*<button onClick=\{\(\) => \{ stopScanner\(\); setStep\(1\); \}\} className="text-xs font-bold text-rio-gold-dark hover:underline">\s*Cambiar Cliente\s*<\/button>\s*<\/div>/;

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

content = content.replace(regex, newHeader);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
