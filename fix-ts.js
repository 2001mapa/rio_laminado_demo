const fs = require('fs');
let c = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

c = c.replace(/await scannerRef\.current\.start\(/g, 'if(scannerRef.current) await scannerRef.current.start(');

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', c);
