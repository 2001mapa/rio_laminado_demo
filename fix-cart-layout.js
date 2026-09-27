const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const target = `<div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] text-rio-muted font-mono leading-none mb-1">{item.product.sku}</p>
                            <p className="text-xs font-bold text-rio-ink truncate pr-2">{item.product.name}</p>
                          </div>`;
                          
const replacement = `<div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-rio-muted font-mono leading-none mb-1 truncate">{item.product.sku}</p>
                            <p className="text-xs font-bold text-rio-ink truncate pr-2">{item.product.name}</p>
                          </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
  console.log('Fixed flex layout for cart items');
} else {
  console.log('Target not found, trying regex...');
  // Regex fallback
  const regex = /<div className="flex justify-between items-start">\s*<div>\s*<p className="text-\[10px\] text-rio-muted font-mono leading-none mb-1">\{item\.product\.sku\}<\/p>\s*<p className="text-xs font-bold text-rio-ink truncate pr-2">\{item\.product\.name\}<\/p>\s*<\/div>/g;
  
  if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
    console.log('Fixed using regex');
  } else {
    console.log('Still not found!');
  }
}
