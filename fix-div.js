const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

code = code.replace(/}\)\(\)}\s*<\/div>\s*<div className="space-y-6">/, '})()}\n          </div>\n\n          <div className="space-y-6">');

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', code);
console.log('Fixed div');
