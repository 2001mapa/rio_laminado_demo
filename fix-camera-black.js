const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Remove aspectRatio: 1.0
code = code.replace(/aspectRatio: 1\.0,/g, '');

// 2. Set scannerRef.current = null after clear
code = code.replace(
  /try { scannerRef\.current\.clear\(\); } catch\(e\) {}/g,
  'try { scannerRef.current.clear(); } catch(e) {}\n        scannerRef.current = null;'
);

// 3. Update useEffect cleanup
const oldUseEffect = `    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch(e) {}
      }
    };`;
    
const newUseEffect = `    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch(e) {}
        try { scannerRef.current.clear(); } catch(e) {}
        scannerRef.current = null;
      }
    };`;

code = code.replace(oldUseEffect, newUseEffect);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed camera black screen issues');
