const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// Remove addCustomer import from useDemo
code = code.replace(/, addCustomer/, '');

// Remove handleCreateCustomer function
const handleRegex = /const handleCreateCustomer = \([\s\S]*?setStep\(2\);\s*\};/;
code = code.replace(handleRegex, '');

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Removed handleCreateCustomer');
