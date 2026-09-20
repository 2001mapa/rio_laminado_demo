const fs = require('fs');
let c = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');
c = c.replace(/await requireRole\(\['admin'\]\);\s*try \{/g, "try {\n    await requireRole(['admin']);");
fs.writeFileSync('src/app/actions/inventory.ts', c);
