const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const target = `  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };`;

const replacement = `  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        if (scannerRef.current.getState() === 2 /* SCANNING */ || scannerRef.current.getState() === 3 /* PAUSED */) {
           await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn("Ignored error while stopping scanner:", err);
      } finally {
        try { scannerRef.current.clear(); } catch(e) {}
        setIsScanning(false);
      }
    }
  };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
} else {
  // Try alternative replacement without exact spaces
  code = code.replace(/const stopScanner = async \(\) => {[\s\S]*?setIsScanning\(false\);\s*}\s*};/m, replacement);
}

// Ensure cleanup also ignores errors safely
code = code.replace(
  `    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };`,
  `    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch(e) {}
      }
    };`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed stopScanner logic');
