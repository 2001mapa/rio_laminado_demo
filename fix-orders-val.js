const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const oldVal = `          // Sizes validation
          if (product.category === 'Anillos' && item.sizeDetails) {
             const sum = item.sizeDetails.reduce((a, b) => a + b.quantity, 0);
             if (sum !== item.quantity) {
                throw new Error(\`La suma de las tallas (\${sum}) no coincide con la cantidad total (\${item.quantity}) para el anillo \${product.name}.\`);
             }
          } else if (item.sizeDetails && product.category !== 'Anillos') {
             throw new Error(\`El producto \${product.name} no es un anillo, no puede llevar desglose de tallas.\`);
          }`;

const newVal = `          // Sizes validation
          if (product.category === 'Anillos') {
             if (!item.sizeDetails || item.sizeDetails.length === 0) {
                throw new Error(\`El anillo \${product.name} requiere al menos una talla.\`);
             }
             const sum = item.sizeDetails.reduce((a, b) => a + b.quantity, 0);
             if (sum !== item.quantity) {
                throw new Error(\`La suma de las tallas (\${sum}) no coincide con la cantidad total (\${item.quantity}) para el anillo \${product.name}.\`);
             }
          } else if (item.sizeDetails && item.sizeDetails.length > 0 && product.category !== 'Anillos') {
             throw new Error(\`El producto \${product.name} no es un anillo, no puede llevar desglose de tallas.\`);
          }`;

if (code.includes(oldVal)) {
  code = code.replace(oldVal, newVal);
  fs.writeFileSync('src/app/actions/orders.ts', code);
  console.log('Fixed sizes validation in orders.ts');
} else {
  console.log('Failed to match sizes validation block');
}
