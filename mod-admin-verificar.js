const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/verificar/page.tsx', 'utf8');

code = code.replace(
  /<p className="text-sm font-semibold text-rio-ink leading-tight">\{product\.name\}<\/p>/,
  `<p className="text-sm font-semibold text-rio-ink leading-tight">{product.name}</p>
                    {item.sizeDetails && item.sizeDetails.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.sizeDetails.map(s => (
                           <span key={s.size} className="text-[10px] font-bold text-rio-ink bg-rio-gold-light/20 border border-rio-gold-light/50 px-1.5 py-0.5 rounded">
                             Talla {s.size}: {s.quantity}
                           </span>
                        ))}
                      </div>
                    )}`
);

fs.writeFileSync('src/app/admin/pedidos/[id]/verificar/page.tsx', code);
console.log("Updated verificar page");
