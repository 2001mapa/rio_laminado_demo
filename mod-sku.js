const fs = require('fs');
let code = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');

// add state
code = code.replace(/const isEdit = !!initialData;/, 'const isEdit = !!initialData;\n  const [enableSkuEdit, setEnableSkuEdit] = useState(false);');

// reset state
code = code.replace(/setHoverPhoto\(null\);\n\s*setError\(''\);/, "setHoverPhoto(null);\n      setError('');\n      setEnableSkuEdit(false);");

// modify input
const regexSku = /<input name="sku" defaultValue=\{initialData\?\.sku \|\| ''\} required type="text" className="w-full border border-rio-border rounded-lg p-2\.5 text-sm font-mono bg-rio-background focus:border-rio-ink outline-none uppercase" placeholder="Ej\. A101" \/>/;
const replaceSku = `<div className="relative">
                    <input name="sku" defaultValue={initialData?.sku || ''} required type="text" disabled={isEdit && !enableSkuEdit} className="w-full border border-rio-border rounded-lg p-2.5 text-sm font-mono bg-rio-background focus:border-rio-ink outline-none uppercase disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ej. A101" />
                    {isEdit && !enableSkuEdit && (
                      <button type="button" onClick={() => setEnableSkuEdit(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-rio-gold-dark font-bold hover:underline">
                        Editar
                      </button>
                    )}
                  </div>`;
code = code.replace(regexSku, replaceSku);

fs.writeFileSync('src/components/CreateProductModal.tsx', code);
console.log('modal sku updated');
