const fs = require('fs');

let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const target = `    if (role !== 'admin') {
      where.isActive = true;
      where.imageUrl = { not: null };
      where.material = { not: 'Por revisar' };`;

const replacement = `    if (role !== 'admin') {
      where.isActive = true;
      
      // Los vendedores pueden ver productos sin foto (para vender en mostrador). Los clientes no.
      if (role === 'cliente') {
        where.imageUrl = { not: null };
        where.material = { not: 'Por revisar' };
      }`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/app/actions/queries.ts', code);
  console.log('Fixed getPagedCatalog filtering for vendors');
} else {
  console.log('Target not found');
}
