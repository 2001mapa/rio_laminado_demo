const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// Remove search counter
const searchTarget = `<span className="text-[12px] text-rio-muted font-bold uppercase tracking-wider">{catalogProducts.length} ref.</span>`;
if (code.includes(searchTarget)) {
  code = code.replace(searchTarget, ``);
}

// Remove category counter
const categoryTarget = `<span className="text-[12px] text-rio-muted font-bold uppercase tracking-wider">{categoryProducts.length} ref.</span>`;
if (code.includes(categoryTarget)) {
  code = code.replace(categoryTarget, ``);
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Removed misleading references counters');
