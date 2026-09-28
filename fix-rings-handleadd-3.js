const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const regex = /const handleAdd = \(\) => \{\s*const stockDisponible = product\.physicalStock - product\.reservedStock;/;

const match = code.match(regex);
if (match) {
  code = code.replace(regex, `const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible = product.physicalStock - product.reservedStock;`);
  fs.writeFileSync('src/app/cliente/page.tsx', code);
  console.log('Fixed handleAdd!');
} else {
  console.log('Could not find it');
}
