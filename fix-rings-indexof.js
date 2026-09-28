const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const handleAddStart = code.indexOf('const handleAdd = () => {\\n    const stockDisponible');
if (handleAddStart === -1) {
    const handleAddStart2 = code.indexOf('const handleAdd = () => {\\n      const stockDisponible');
    if (handleAddStart2 !== -1) {
        code = code.substring(0, handleAddStart2) + 
`const handleAdd = () => {
      if (product.category === 'Anillos') {
         onExpand();
         return;
      }
      const stockDisponible` + code.substring(handleAddStart2 + 42);
        console.log('Fixed handleAdd (spaced)');
    } else {
        const handleAddStart3 = code.indexOf('const handleAdd = () => {\\r\\n    const stockDisponible');
        if (handleAddStart3 !== -1) {
            code = code.substring(0, handleAddStart3) + 
`const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible` + code.substring(handleAddStart3 + 44);
            console.log('Fixed handleAdd (CRLF)');
        }
    }
} else {
    code = code.substring(0, handleAddStart) + 
`const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible` + code.substring(handleAddStart + 43);
    console.log('Fixed handleAdd');
}

const footerStart = code.indexOf('<div className="mt-3.5 flex items-center gap-2">');
const footerEnd = code.indexOf('onClick={handleAdd}', footerStart);

if (footerStart !== -1 && footerEnd !== -1) {
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
            `;
    code = code.substring(0, footerStart) + newFooter + code.substring(footerEnd);
    console.log('Fixed footer');
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
