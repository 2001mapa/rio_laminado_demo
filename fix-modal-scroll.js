const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const targetDiv = '<div className="p-4 space-y-3 overflow-y-auto">';
const replaceDiv = '<div className="p-4 space-y-3 overflow-y-auto" onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>';

code = code.replace(targetDiv, replaceDiv);
fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Fixed ProductModal overflow propagation');
