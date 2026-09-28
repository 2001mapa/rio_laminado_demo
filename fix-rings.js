const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const regexHandleAdd = /const handleAdd = \(\) => \{\n\s*const stockDisponible = product\.physicalStock - product\.reservedStock;\n\s*if \(quantity \+ currentCartQuantity > stockDisponible\) \{/;

if (code.match(regexHandleAdd)) {
  code = code.replace(regexHandleAdd, `const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible = product.physicalStock - product.reservedStock;
    if (quantity + currentCartQuantity > stockDisponible) {`);
  console.log('Fixed handleAdd');
} else {
  console.log('Could not find handleAdd');
}

const regexFooter = /<div className="mt-3\.5 flex items-center gap-2">[\s\S]*?<div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">[\s\S]*?<button onClick=\{\(\) => setQuantity\(Math\.max\(1, quantity - 1\)\)\} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border\/80 transition-colors">[\s\S]*?<Minus className="w-3\.5 h-3\.5" \/>[\s\S]*?<\/button>[\s\S]*?<span className="text-sm font-semibold flex-1 text-center text-rio-ink">\{quantity\}<\/span>[\s\S]*?<button onClick=\{\(\) => \{ const s = product\.physicalStock - product\.reservedStock; if\(quantity \+ currentCartQuantity < s\) setQuantity\(quantity \+ 1\); \}\} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border\/80 transition-colors">[\s\S]*?<Plus className="w-3\.5 h-3\.5" \/>[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<button\n\s*onClick=\{handleAdd\}/;

const newFooter = `<div className="mt-3.5 flex items-center gap-2">
          {product.category === 'Anillos' ? (
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
            onClick={handleAdd}`;

if (code.match(regexFooter)) {
  code = code.replace(regexFooter, newFooter);
  console.log('Fixed footer');
} else {
  console.log('Could not find footer');
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
