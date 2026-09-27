const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Add isStartingRef
code = code.replace(
  `const scannerRef = useRef<Html5Qrcode | null>(null);`,
  `const scannerRef = useRef<Html5Qrcode | null>(null);\n  const isStartingRef = useRef(false);`
);

// 2. Fix useEffect cleanup (remove isScanning from dependency array)
const oldUseEffect = `  // Stop scanner when unmounting or leaving step 2
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch(e) {}
        try { scannerRef.current.clear(); } catch(e) {}
        scannerRef.current = null;
      }
    };
  }, [isScanning]);`;

const newUseEffect = `  // Stop scanner when unmounting or leaving step 2
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const cleanup = async () => {
          try {
             if (scannerRef.current && (scannerRef.current.getState() === 2 || scannerRef.current.getState() === 3)) {
                await scannerRef.current.stop();
             }
          } catch(e) {}
          try { if (scannerRef.current) scannerRef.current.clear(); } catch(e) {}
          scannerRef.current = null;
        };
        cleanup();
      }
    };
  }, []); // <-- Empty array is critical! Only runs on unmount.`;

if (code.includes(oldUseEffect)) {
  code = code.replace(oldUseEffect, newUseEffect);
} else {
  console.log('Failed to find oldUseEffect, trying regex');
  code = code.replace(/\/\/ Stop scanner when unmounting[\s\S]*?\}, \[isScanning\]\);/, newUseEffect);
}

// 3. Update startScanner to use isStartingRef and safe qrbox
const oldStartScanner = /const startScanner = async \(\) => \{[\s\S]*?addToast\("Error de cámara: Asegúrate de dar permisos en el navegador\."\);\s*\}\s*\};/m;

const newStartScanner = `const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerRegionId);
      }
      
      const safeQrbox = (w: number, h: number) => {
        const minEdge = Math.min(w, h);
        if (minEdge === 0) return { width: 250, height: 250 };
        const size = Math.max(150, Math.min(250, minEdge * 0.7));
        return { width: size, height: size };
      };

      // Intentar primero con facingMode environment (estándar y más compatible con iOS/Safari)
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: safeQrbox },
        (decodedText) => {
          if (scannerRef.current) { try { scannerRef.current.pause(); } catch(e){} }
          handleScan(decodedText);
        },
        (error) => {}
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner with environment", err);
      // Fallback: listar cámaras e intentar con el primer deviceId disponible
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera') || c.label.toLowerCase().includes('environment'));
          const cameraId = backCamera ? backCamera.id : cameras[0].id;
          
          if(scannerRef.current) await scannerRef.current.start(
            { deviceId: { exact: cameraId } },
            { fps: 10, qrbox: safeQrbox },
            (decodedText) => {
              if (scannerRef.current) { try { scannerRef.current.pause(); } catch(e){} }
              handleScan(decodedText);
            },
            (error) => {}
          );
          setIsScanning(true);
          isStartingRef.current = false;
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback error", fallbackErr);
      }
      addToast("Error de cámara: Asegúrate de dar permisos en el navegador.");
      setIsScanning(false);
    } finally {
      isStartingRef.current = false;
    }
  };`;

code = code.replace(oldStartScanner, newStartScanner);

// 4. Update stopScanner to strictly wait for stop, then clear
const oldStopScanner = /const stopScanner = async \(\) => \{[\s\S]*?setIsScanning\(false\);\s*\}\s*\};/;

const newStopScanner = `const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        if (scannerRef.current.getState() === 2 /* SCANNING */ || scannerRef.current.getState() === 3 /* PAUSED */) {
           await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn("Ignored error while stopping scanner:", err);
      } finally {
        try { if (scannerRef.current) scannerRef.current.clear(); } catch(e) {}
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };`;

code = code.replace(oldStopScanner, newStopScanner);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed useEffect dependency loop, race conditions, and dynamic qrbox.');
