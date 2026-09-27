const fs = require('fs');
let c = fs.readFileSync('src/app/actions/queries.ts','utf8');
c = c.replace(/if \(product\.status !== 'active'\)/g, 'if (!product.isActive)');
fs.writeFileSync('src/app/actions/queries.ts', c);
