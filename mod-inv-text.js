const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

const regexText = /<strong>Información:<\/strong> La importación actualiza el stock físico y datos principales\. Si el nombre sugiere un material diferente al existente, se conservará el actual y se advertirá para protección de historial\./;
const replacementText = `<strong>Información:</strong> Para referencias existentes, el CSV reemplaza nombre, categoría, precio, cantidad física y ubicación. Conserva fotos, material confirmado, estado de publicación y unidades reservadas. Para referencias nuevas, crea el producto y detecta Laminado, Plata o Rodio a partir del nombre. Si no puede identificar un único material, queda Por revisar.<br/><br/>El archivo debe usar <code>;</code> o <code>,</code> como separador.`;

code = code.replace(regexText, replacementText);

fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('InventarioPage text updated');
