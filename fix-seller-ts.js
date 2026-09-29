const fs = require('fs');
let s = fs.readFileSync('src/components/SellerModal.tsx', 'utf8');
s = s.replace(/setError\(res\.message\);/g, "setError(res.message || 'Error desconocido');");
fs.writeFileSync('src/components/SellerModal.tsx', s);
console.log("Fixed SellerModal TS error");
