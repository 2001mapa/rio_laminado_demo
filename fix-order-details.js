const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/pedido/[id]/page.tsx', 'utf8');

const target = `<p className="text-base font-semibold text-rio-ink truncate mb-1.5">{product.name}</p>
                    <span className="text-sm font-bold text-rio-gold-dar`;

const replacement = `<p className="text-base font-semibold text-rio-ink truncate mb-1.5">{product.name}</p>
                    {item.sizeDetails && item.sizeDetails.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {item.sizeDetails.map((s: any, idx: number) => (
                           <span key={idx} className="bg-rio-surface border border-rio-border px-2 py-0.5 rounded-md text-[11px] font-bold text-rio-ink">T{s.size} <span className="text-rio-muted font-normal">x{s.quantity}</span></span>
                        ))}
                      </div>
                    )}
                    <span className="text-sm font-bold text-rio-gold-dar`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/app/cliente/pedido/[id]/page.tsx', code);
  console.log('Fixed sizes in order details');
} else {
  const regex = /<p className="text-base font-semibold text-rio-ink truncate mb-1\.5">\{product\.name\}<\/p>\s*<span className="text-sm font-bold text-rio-gold-dar/;
  if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/app/cliente/pedido/[id]/page.tsx', code);
    console.log('Fixed sizes via regex');
  } else {
    console.log('Target not found');
  }
}
