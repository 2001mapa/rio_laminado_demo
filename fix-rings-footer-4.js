const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const startStr = '<div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">';
const endStr = 'onClick={handleAdd}';

const start = code.indexOf(startStr);
const end = code.indexOf(endStr, start);

if (start !== -1 && end !== -1) {
  const newFooter = `{product.category === 'Anillos' ? (
            <button
              onClick={onExpand}
              className="flex-1 h-9 rounded-xl border border-rio-border bg-rio-surface text-rio-ink font-bold text-[13px] hover:border-rio-gold hover:text-rio-gold transition-colors"
            >
              Seleccionar tallas
            </button>
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
            `;
  code = code.substring(0, start) + newFooter + code.substring(end);
  fs.writeFileSync('src/app/cliente/page.tsx', code);
  console.log('Fixed card footer!');
} else {
  console.log('Could not find boundaries');
}
