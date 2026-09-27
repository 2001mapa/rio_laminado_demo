const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

code = code.replace(
  'overflow-y-auto border border-rio-border rounded-xl bg-rio-background/50',
  'overflow-y-auto overflow-x-hidden border border-rio-border rounded-xl bg-rio-background/50'
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
