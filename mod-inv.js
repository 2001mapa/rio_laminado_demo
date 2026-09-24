const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

const regexTh = /<th className="px-6 py-4 text-left text-\[10px\] font-bold text-rio-muted uppercase tracking-wider hidden md:table-cell">\s*Categoría\s*<\/th>/;
const replaceTh = `<th className="px-6 py-4 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider hidden md:table-cell">Categoría</th>
<th className="px-6 py-4 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider hidden md:table-cell">Material</th>`;
code = code.replace(regexTh, replaceTh);

const regexTd = /<td className="px-6 py-4 whitespace-nowrap text-\[13px\] font-medium text-rio-muted hidden md:table-cell">\s*\{product\.category\}\s*<\/td>/;
const replaceTd = `<td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-rio-muted hidden md:table-cell">{product.category}</td>
<td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium hidden md:table-cell">
  <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${product.material === 'Por revisar' ? 'bg-rio-danger/10 text-rio-danger border border-rio-danger/20' : 'bg-rio-surface-muted text-rio-ink border border-rio-border'}\`}>
    {product.material || 'Por revisar'}
  </span>
</td>`;
code = code.replace(regexTd, replaceTd);

fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('inventory updated');
