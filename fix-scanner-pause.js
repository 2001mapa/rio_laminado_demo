const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

code = code.replace(
  /if \(scannerRef\.current\) scannerRef\.current\.pause\(\);/g,
  'if (scannerRef.current) { try { scannerRef.current.pause(); } catch(e){} }'
);

code = code.replace(
  /if \(scannerRef\.current\) scannerRef\.current\.resume\(\);/g,
  'if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }'
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Wrapped pause and resume in try-catch');
