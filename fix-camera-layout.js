const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// Replace the startScanner function
const startScannerRegex = /const startScanner = async \(\) => \{[\s\S]*?setIsScanning\(true\);\s*return;\s*}\s*catch \(fallbackErr\) \{\}\s*}\s*addToast\("Error de cámara: Asegúrate de dar permisos en el navegador\."\);\s*}\s*};/m;

const newStartScanner = `  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerRegionId);
      }
      
      // Intentar primero con facingMode environment (estándar y más compatible con iOS/Safari)
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250 // Tamaño fijo para evitar fallos de cálculo de layout que generen un marco de 0x0 (pantalla negra)
        },
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
          
          await scannerRef.current.start(
            { deviceId: { exact: cameraId } },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
              if (scannerRef.current) { try { scannerRef.current.pause(); } catch(e){} }
              handleScan(decodedText);
            },
            (error) => {}
          );
          setIsScanning(true);
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback error", fallbackErr);
      }
      addToast("Error de cámara: Asegúrate de dar permisos en el navegador.");
    }
  };`;

code = code.replace(startScannerRegex, newStartScanner);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log("Updated startScanner with fixed qrbox and simplified facingMode");
