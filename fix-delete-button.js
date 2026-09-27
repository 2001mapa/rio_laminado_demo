const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const target = `className="text-rio-muted hover:text-rio-danger p-1 shrink-0 bg-rio-surface-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100"`;
const replacement = `className="text-rio-muted hover:text-rio-danger hover:bg-rio-danger/10 p-1.5 shrink-0 bg-rio-surface-muted rounded-md transition-all active:scale-95"`;

code = code.replace(target, replacement);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed delete button visibility for mobile devices');
