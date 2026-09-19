const fs = require('fs');

let mockData = fs.readFileSync('src/lib/mockData.ts', 'utf-8');
mockData = mockData.replace(/name:\s*'([^']+)'/g, (match, name) => {
  return `${match}, username: '${name.toLowerCase().replace(/[^a-z0-9]/g, '')}'`;
});
fs.writeFileSync('src/lib/mockData.ts', mockData);

let nuevaVenta = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf-8');
nuevaVenta = nuevaVenta.replace(/name:\s*'Cliente Público',/g, "name: 'Cliente Público', username: 'publico',");
fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', nuevaVenta);

let sellerModal = fs.readFileSync('src/components/SellerModal.tsx', 'utf-8');
sellerModal = sellerModal.replace(/name:\s*res\.seller\.name,/g, "name: res.seller.name,\n            username: sellerData.email,");
fs.writeFileSync('src/components/SellerModal.tsx', sellerModal);
