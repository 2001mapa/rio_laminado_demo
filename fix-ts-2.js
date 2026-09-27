const fs = require('fs');
let c = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');
c = c.replace(/setSkuSuggestions\(res\.products\);/g, 'setSkuSuggestions(res.products as any);');
fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', c);
