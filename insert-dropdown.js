const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /<form[\s\S]*?onSubmit=\{\(e\) => \{[\s\S]*?e\.preventDefault\(\);[\s\S]*?if \(manualSku\.trim\(\)\) \{[\s\S]*?handleScan\(manualSku\);[\s\S]*?setManualSku\(""\);[\s\S]*?\}[\s\S]*?\}\}[\s\S]*?className="flex gap-2"[\s\S]*?>[\s\S]*?<input[\s\S]*?placeholder="Ingresar SKU manualmente"[\s\S]*?value=\{manualSku\}[\s\S]*?onChange=\{e => setManualSku\(e\.target\.value\)\}[\s\S]*?className="flex-1 bg-rio-background border border-rio-border rounded-xl px-4 py-2\.5 text-\[13px\] focus:outline-none focus:border-rio-gold-dark"[\s\S]*?\/>[\s\S]*?<button type="submit" className="bg-rio-ink text-white px-4 py-2\.5 rounded-xl font-bold text-\[13px\] hover:bg-rio-ink\/80 transition-colors">[\s\S]*?Buscar[\s\S]*?<\/button>[\s\S]*?<\/form>/;

const replacement = `<div className="relative">
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (manualSku.trim()) {
                      setSkuSuggestions([]);
                      handleScan(manualSku);
                      setManualSku("");
                    }
                  }}
                  className="flex gap-2 relative z-50"
                >
                  <input 
                    type="text"
                    placeholder="Ingresar SKU manualmente"
                    value={manualSku}
                    onChange={e => setManualSku(e.target.value)}
                    className="flex-1 bg-rio-background border border-rio-border rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-rio-gold-dark"
                  />
                  <button type="submit" className="bg-rio-ink text-white px-4 py-2.5 rounded-xl font-bold text-[13px] hover:bg-rio-ink/80 transition-colors">
                    Buscar
                  </button>
                </form>

                {(isSearchingSku || skuSuggestions.length > 0) && manualSku.trim().length > 0 && !scannedProduct && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-rio-border z-[100] max-h-60 overflow-y-auto animate-fade-in">
                    {isSearchingSku && skuSuggestions.length === 0 && (
                      <div className="p-4 text-center text-sm text-rio-muted font-medium">
                        Buscando referencias...
                      </div>
                    )}
                    {!isSearchingSku && skuSuggestions.length === 0 && manualSku.trim().length > 2 && (
                      <div className="p-4 text-center text-sm text-rio-muted font-medium">
                        No se encontraron coincidencias
                      </div>
                    )}
                    {skuSuggestions.map(p => (
                      <button 
                        key={p.id} 
                        type="button"
                        onClick={() => {
                           setManualSku("");
                           setSkuSuggestions([]);
                           handleScan(p.sku);
                        }}
                        className="w-full text-left px-4 py-3 border-b border-rio-border/50 hover:bg-rio-surface transition-colors flex items-center justify-between last:border-0"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="text-[10px] text-rio-muted font-mono mb-0.5">{p.sku}</p>
                          <p className="text-xs font-bold text-rio-ink truncate">{p.name}</p>
                        </div>
                        <span className="text-xs font-bold text-rio-gold-dark shrink-0">{formatPrice(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
                </div>`;

if(code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
  console.log('Successfully inserted dropdown HTML');
} else {
  console.log('Regex failed to match');
}
