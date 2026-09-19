const fs = require('fs');
let file = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf-8');
file = file.replace(/name: 'Cliente Público',/g, "name: 'Cliente Público', username: 'publico',");
fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', file);
