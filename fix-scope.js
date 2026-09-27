const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const oldStart = `    const startScanner = async () => {
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
      };`;

const newStart = `    const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    const safeQrbox = (w: number, h: number) => {
      const minEdge = Math.min(w, h);
      if (minEdge === 0) return { width: 250, height: 250 };
      const size = Math.max(150, Math.min(250, minEdge * 0.7));
      return { width: size, height: size };
    };

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerRegionId);
      }`;

code = code.replace(oldStart, newStart);

// Handle the case where indentation is different
const fallbackOldStart = `  const startScanner = async () => {
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
      };`;

const fallbackNewStart = `  const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    const safeQrbox = (w: number, h: number) => {
      const minEdge = Math.min(w, h);
      if (minEdge === 0) return { width: 250, height: 250 };
      const size = Math.max(150, Math.min(250, minEdge * 0.7));
      return { width: size, height: size };
    };

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerRegionId);
      }`;

code = code.replace(fallbackOldStart, fallbackNewStart);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
