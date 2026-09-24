const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

code = code.split('elements.push({ type: \'marker\', text: `Fin de ${g.material}` });').join('');

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', code);
console.log('Removed marker push');
