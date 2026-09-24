const fs = require('fs');
let code = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');

// Insert import
code = code.replace(
  "import { Upload, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';",
  "import { Upload, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';\nimport { OFFICIAL_PRODUCT_TYPES, normalizeProductType } from '@/lib/constants';"
);

// Find category input and replace with select
const categoryRegex = /<label className="block text-\[11px\] font-bold text-rio-muted uppercase tracking-wider mb-1\.5">Categoría<\/label>\s*<input name="category" defaultValue=\{initialData\?\.category \|\| ''\} required type="text" className="w-full border border-rio-border rounded-lg p-2\.5 text-sm bg-rio-background focus:border-rio-ink outline-none" placeholder="Ej\. Anillos" \/>/;

const replacement = `<label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5">Tipo de Producto</label>
                  <select name="category" defaultValue={initialData?.category ? normalizeProductType(initialData.category) : ''} required className="w-full border border-rio-border rounded-lg p-2.5 text-sm bg-rio-background focus:border-rio-ink outline-none">
                    <option value="" disabled>Selecciona un tipo...</option>
                    {OFFICIAL_PRODUCT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>`;

code = code.replace(categoryRegex, replacement);

fs.writeFileSync('src/components/CreateProductModal.tsx', code);
console.log('CreateProductModal.tsx updated');
