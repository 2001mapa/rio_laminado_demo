const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const oldHandleAdd = `  const handleAdd = () => {
    const stockDisponible = product.physicalStock - product.reservedStock;
    if (quantity + currentCartQuantity > stockDisponible) {
      addToast('Lmite de inventario alcanzado ( unidades disponibles)');
      return;
    }
    addToCart(product, quantity);
    setQuantity(1);
    setAdded(true);
    addToast(\`\${product.name} agregado al carrito\`);
    setTimeout(() => setAdded(false), 1500);
  };`;

const newHandleAdd = `  const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible = product.physicalStock - product.reservedStock;
    if (quantity + currentCartQuantity > stockDisponible) {
      addToast(\`Límite de inventario alcanzado (\${stockDisponible} unidades disponibles)\`);
      return;
    }
    addToCart(product, quantity);
    setQuantity(1);
    setAdded(true);
    addToast(\`\${product.name} agregado al carrito\`);
    setTimeout(() => setAdded(false), 1500);
  };`;

if (code.includes(oldHandleAdd)) {
  code = code.replace(oldHandleAdd, newHandleAdd);
} else {
  // Use regex
  const regex = /const handleAdd = \(\) => \{[\s\S]*?addToCart\(product, quantity\);[\s\S]*?setTimeout\(\(\) => setAdded\(false\), 1500\);\n\s*\};/;
  code = code.replace(regex, newHandleAdd);
}

// Change the add button behavior in ProductCard for Rings
const oldButtonHtml = `<button
          onClick={handleAdd}
          className={\`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 active:scale-95 \${
            added ? 'bg-rio-success text-white' : 'bg-rio-ink hover:bg-rio-ink/90 text-white shadow-sm'
          }\`}
        >
          {added ? <ShoppingBag className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
        </button>`;

const newButtonHtml = `<button
          onClick={handleAdd}
          className={\`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 active:scale-95 \${
            added ? 'bg-rio-success text-white' : 'bg-rio-ink hover:bg-rio-ink/90 text-white shadow-sm'
          }\`}
          title={product.category === 'Anillos' ? 'Seleccionar tallas' : 'Agregar al pedido'}
        >
          {added ? <ShoppingBag className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
        </button>`;

if (code.includes(oldButtonHtml)) {
   code = code.replace(oldButtonHtml, newButtonHtml);
} else {
   const btnRegex = /<button[\s\S]*?onClick=\{handleAdd\}[\s\S]*?\{added \? <ShoppingBag className="w-4 h-4" \/> : <Plus className="w-5 h-5" \/>\}[\s\S]*?<\/button>/;
   code = code.replace(btnRegex, newButtonHtml);
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Fixed ProductCard handleAdd for rings');
