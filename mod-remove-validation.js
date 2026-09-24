const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const blockToRemoveRegex = /\/\/ Bloquear confirmación o avance si faltan facturas[\s\S]*?if \(!allInvoiced\) \{[\s\S]*?throw new Error\([^)]+\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}/;
// We can do a simpler replace by just replacing that whole if (action === 'PACK' ...) block with empty string.

code = code.replace(/\/\/ Bloquear confirmaci(o|ó)n o avance si faltan facturas[\s\S]*?if \(action === 'PACK' \|\| action === 'DISPATCH'\) \{[\s\S]*?const orderWithGroups = await tx\.order\.findUnique\(\{ where: \{ id: orderId \}, include: \{ groups: true \} \}\);[\s\S]*?if \(orderWithGroups\?\.groups && orderWithGroups\.groups\.length > 0\) \{[\s\S]*?const allInvoiced = orderWithGroups\.groups\.every\(g => g\.externalInvoice\);[\s\S]*?if \(!allInvoiced\) \{[\s\S]*?throw new Error\([^)]+\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}/, '');

fs.writeFileSync('src/app/actions/orders.ts', code);
console.log('Removed external invoice validation logic from backend');
