const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Import getPagedCatalog
code = code.replace(
  `import { getExactProductBySku } from '@/app/actions/queries';`,
  `import { getExactProductBySku, getPagedCatalog } from '@/app/actions/queries';`
);

// 2. Add state for suggestions
const stateTarget = `const [manualSku, setManualSku] = useState("");`;
const stateReplacement = `const [manualSku, setManualSku] = useState("");
  const [skuSuggestions, setSkuSuggestions] = useState<Product[]>([]);
  const [isSearchingSku, setIsSearchingSku] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (manualSku.trim().length >= 1 && !scannedProduct) {
        setIsSearchingSku(true);
        try {
          const res = await getPagedCatalog({ search: manualSku, limit: 5 });
          if (res.success && res.products) {
            setSkuSuggestions(res.products);
          }
        } catch(e) {}
        setIsSearchingSku(false);
      } else {
        setSkuSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [manualSku, scannedProduct]);`;
code = code.replace(stateTarget, stateReplacement);

// 3. Update the search bar to have a relative parent and render the dropdown
const searchTarget = `<form 
                    onSubmit={(e) => { 
                      e.preventDefault(); 
                      if (manualSku.trim()) {
                        handleScan(manualSku);
                        setManualSku("");
                      }
                    }}
                    className="flex gap-2"
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
                  </form>`;

const searchReplacement = `<div className="relative">
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
                  {skuSuggestions.length > 0 && manualSku.trim().length > 0 && !scannedProduct && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-rio-border z-[100] max-h-60 overflow-y-auto animate-fade-in">
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
code = code.replace(searchTarget, searchReplacement);

// 4. Update the scannedProduct modal to take the full space of the camera area, without floating
const modalTarget = `{scannedProduct && (
                  <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative animate-zoom-in shadow-2xl">
                      <button onClick={cancelScan} className="absolute top-4 right-4 text-rio-muted hover:text-rio-ink p-1">
                        <X className="w-5 h-5"/>
                      </button>
                      
                      <div className="flex gap-4 items-center mb-6 border-b border-rio-border pb-4 pt-2">`;

const modalReplacement = `{scannedProduct && (
                  <div className="absolute inset-0 bg-white z-40 flex flex-col p-4 sm:p-6 overflow-y-auto animate-zoom-in">
                    <button onClick={cancelScan} className="absolute top-3 right-3 text-rio-muted hover:text-rio-ink p-2 bg-rio-background rounded-full transition-colors">
                      <X className="w-5 h-5"/>
                    </button>
                    
                    <div className="flex gap-4 items-center mb-6 border-b border-rio-border pb-4 pr-10">`;

code = code.replace(modalTarget, modalReplacement);

const modalEndTarget = `                      <button 
                        onClick={confirmScan} 
                        disabled={(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0}
                        className="w-full bg-black disabled:bg-rio-border disabled:text-rio-muted text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                      >
                        {(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0 ? 'Sin Inventario' : 'Agregar a la Orden'}
                      </button>
                    </div>
                  </div>
                )}`;

const modalEndReplacement = `                      <div className="mt-auto pt-2">
                        <button 
                          onClick={confirmScan} 
                          disabled={(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0}
                          className="w-full bg-rio-ink disabled:bg-rio-border disabled:text-rio-muted text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                        >
                          {(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0 ? 'Sin Inventario' : 'Agregar a la Orden'}
                        </button>
                      </div>
                  </div>
                )}`;

code = code.replace(modalEndTarget, modalEndReplacement);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed modal layout and added autocomplete');
