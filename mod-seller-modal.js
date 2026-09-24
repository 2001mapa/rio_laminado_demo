const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// Remove modal block
const modalRegex = /\{showNewCustomerModal && \([\s\S]*?<\/div>\s*\)\}/;
code = code.replace(modalRegex, '');

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Modal removed');
