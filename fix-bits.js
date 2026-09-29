const fs = require('fs');

let c = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');
c = c.replace(/onComplete\(finalProduct\);/g, "onComplete();");
fs.writeFileSync('src/components/CreateProductModal.tsx', c);

let s = fs.readFileSync('src/components/SellerModal.tsx', 'utf8');
s = s.replace(/setTempPassword\(res\.tempPassword\);/g, "setTempPassword(res.tempPassword || '');");
fs.writeFileSync('src/components/SellerModal.tsx', s);

console.log("Fixed final bits");
