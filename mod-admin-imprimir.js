const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/imprimir/page.tsx', 'utf8');

code = code.replace(
  /\{product\.name\}/,
  `{product.name}
                    {item.sizeDetails && item.sizeDetails.length > 0 && (
                      <div className="mt-1 text-[10px] font-bold text-black bg-gray-100 p-1 rounded inline-block">
                        Tallas: {item.sizeDetails.map(s => \`\${s.size} x \${s.quantity}\`).join(' | ')}
                      </div>
                    )}`
);

fs.writeFileSync('src/app/admin/pedidos/[id]/imprimir/page.tsx', code);
console.log("Updated imprimir page");
