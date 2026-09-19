const fs = require('fs');

function replaceFile(path, oldText, newText) {
  let content = fs.readFileSync(path, 'utf-8');
  content = content.replace(new RegExp(oldText, 'g'), newText);
  fs.writeFileSync(path, content);
}

replaceFile('src/app/admin/layout.tsx', '/acceso-rio', '/api/auth/logout');
replaceFile('src/app/cliente/perfil/page.tsx', '/acceso-rio', '/api/auth/logout');
replaceFile('src/app/cliente/layout.tsx', '/acceso-rio', '/api/auth/logout');
replaceFile('src/app/vendedor/perfil/page.tsx', '/acceso-rio', '/api/auth/logout');
replaceFile('src/app/vendedor/layout.tsx', '/acceso-rio', '/api/auth/logout');

// Seller Modal specific
let sellerModal = fs.readFileSync('src/components/SellerModal.tsx', 'utf-8');
sellerModal = sellerModal.replace(/acceso-rio\?token=\$\{successData\.id\}/g, 'login');
sellerModal = sellerModal.replace(/acceso-rio\?token=\{successData\.id\}/g, 'login');
fs.writeFileSync('src/components/SellerModal.tsx', sellerModal);
