const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// 1. handleAdd for Rings
const oldHandleAdd = `const handleAdd = () => {
    const stockDisponible = product.physicalStock - product.reservedStock;`;
const newHandleAdd = `const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible = product.physicalStock - product.reservedStock;`;
code = code.replace(oldHandleAdd, newHandleAdd);

// 2. Hide quantity on Rings
const oldQtyHtml = `<div className="mt-3.5 flex items-center gap-2">
          <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold flex-1 text-center text-rio-ink">{quantity}</span>
            <button onClick={() => { const s = product.physicalStock - product.reservedStock; if(quantity + currentCartQuantity < s) setQuantity(quantity + 1); }} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={handleAdd}`;

const newQtyHtml = `<div className="mt-3.5 flex items-center gap-2">
          {product.category === 'Anillos' ? (
            <button onClick={onExpand} className="flex-1 h-9 rounded-xl border border-rio-border bg-rio-surface text-rio-ink font-bold text-[13px] hover:border-rio-gold hover:text-rio-gold transition-colors">Seleccionar tallas</button>
          ) : (
          <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold flex-1 text-center text-rio-ink">{quantity}</span>
            <button onClick={() => { const s = product.physicalStock - product.reservedStock; if(quantity + currentCartQuantity < s) setQuantity(quantity + 1); }} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          )}
          <button
            onClick={handleAdd}`;
code = code.replace(oldQtyHtml, newQtyHtml);

// 3. Search Empty state
const oldSearchEmpty = `!isLoading && (
                  <div className="text-center py-20 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
                    <p className="text-rio-muted font-medium">No se encontraron productos para "{searchTerm}"</p>
                  </div>
                )`;
const newSearchEmpty = `!isLoading && (
                  <div className="text-center py-20 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
                    <p className="text-rio-muted font-medium">{searchTerm ? \`No se encontraron productos para "\${searchTerm}"\` : 'No hay productos disponibles en esta categoría o material.'}</p>
                  </div>
                )`;
code = code.replace(oldSearchEmpty, newSearchEmpty);

// 4. Categories Empty state
const oldCatsMap = `categories.slice(1).map(category => {
              const categoryProducts = catalogProducts.filter(p => p.category === category);`;
const newCatsMap = `catalogProducts.length > 0 ? categories.slice(1).map(category => {
              const categoryProducts = catalogProducts.filter(p => p.category === category);`;
code = code.replace(oldCatsMap, newCatsMap);

const oldCatsEnd = `                  </div>
                </div>
              );
            })
          )}`;
const newCatsEnd = `                  </div>
                </div>
              );
            }) : !isLoading && (
              <div className="text-center py-20 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
                <p className="text-rio-muted font-medium">No hay productos disponibles con los filtros actuales.</p>
              </div>
            )
          )}`;
code = code.replace(oldCatsEnd, newCatsEnd);


fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Done reverting and fixing client/page.tsx');
