const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/imprimir/page.tsx', 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/app/admin/inventario/imprimir/page.tsx', code);
console.log('Fixed backticks');
