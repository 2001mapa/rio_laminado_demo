const fs = require('fs');
let orders = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

orders = orders.replace(
  /clientRequestId\?: string;\s*\}/,
  `clientRequestId?: string;\n    newCustomerData?: { name: string, phone: string, city: string, address: string, email?: string };\n  }`
);

fs.writeFileSync('src/app/actions/orders.ts', orders);

let clients = fs.readFileSync('src/app/actions/clients.ts', 'utf8');
clients = clients.replace(
  `await requireRole(['admin']);`,
  `const { user } = await requireRole(['admin']);`
);
fs.writeFileSync('src/app/actions/clients.ts', clients);
