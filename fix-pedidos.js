const fs = require('fs');

let code = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');

code = code.replace(/order\.number/g, 'order.orderNumber');

fs.writeFileSync('src/app/admin/pedidos/page.tsx', code);
console.log('Fixed order number display in Bandeja de Pedidos');
