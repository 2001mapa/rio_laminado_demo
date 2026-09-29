const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// Fix 1: Add min-h-0 to the flex-1 wrapper
code = code.replace(
  '<div key={product.id} className="animate-fade-in flex flex-col flex-1">',
  '<div key={product.id} className="animate-fade-in flex flex-col flex-1 min-h-0">'
);

// Fix 2: Add flex-1 min-h-0 to the overflow container
code = code.replace(
  '<div className="p-4 space-y-3 overflow-y-auto"',
  '<div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0"'
);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Fixed CSS flexbox scrolling bug');
