const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

code = code.replace(/await tx\.order\.create\(\{ \{/, 'await tx.order.create({');

fs.writeFileSync('src/app/actions/orders.ts', code);
console.log('Fixed syntax error');
