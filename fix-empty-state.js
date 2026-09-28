const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const oldEmptySearch = `<p className="text-rio-muted font-medium">No se encontraron productos para "{searchTerm}"</p>`;
const newEmptySearch = `<p className="text-rio-muted font-medium">{searchTerm ? \`No se encontraron productos para "\${searchTerm}"\` : 'No hay productos disponibles en esta categoría.'}</p>`;

if (code.includes(oldEmptySearch)) {
  code = code.replace(oldEmptySearch, newEmptySearch);
  fs.writeFileSync('src/app/cliente/page.tsx', code);
  console.log('Fixed empty state text');
} else {
  console.log('Not found');
}
