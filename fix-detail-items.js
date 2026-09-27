const fs = require('fs');

const path = 'src/app/admin/pedidos/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix the sorting logic
code = code.replace(
  /const pA = products\.find\(p => p\.id === a\.productId\);\s*const pB = products\.find\(p => p\.id === b\.productId\);/g,
  'const pA = a.product;\n    const pB = b.product;'
);

// Fix the mapping logic
code = code.replace(
  /const product = products\.find\(p => p\.id === item\.productId\);/g,
  'const product = item.product;'
);

// We should also fix order.number to order.orderNumber just in case
code = code.replace(/order\.number/g, 'order.orderNumber');

fs.writeFileSync(path, code);
console.log('Fixed detail page to use item.product');
