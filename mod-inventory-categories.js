const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

code = code.replace(
  "import { requireRole } from '@/utils/auth-helpers'",
  "import { requireRole } from '@/utils/auth-helpers'\nimport { normalizeProductType, OFFICIAL_PRODUCT_TYPES } from '@/lib/constants'"
);

const regexPreview = /const suggestedMaterial = detectMaterial\(item\.name \|\| ''\);/;
const replacementPreview = `const normalizedCategory = normalizeProductType(item.category || '');
      if (!OFFICIAL_PRODUCT_TYPES.includes(normalizedCategory)) {
        errors.push({ row: rowNum, error: \`Tipo de producto inválido: "\${item.category}". Tipos válidos: \${OFFICIAL_PRODUCT_TYPES.join(', ')}\` });
        return;
      }
      
      const suggestedMaterial = detectMaterial(item.name || '');`;
code = code.replace(regexPreview, replacementPreview);

const regexUpdate = /category: item\.category,/g;
const replacementUpdate = `category: normalizeProductType(item.category),`;
code = code.replace(regexUpdate, replacementUpdate);

const regexCreate = /category: item\.category \|\| 'Sin categoría',/g;
const replacementCreate = `category: normalizeProductType(item.category) || 'Sin categoría',`;
code = code.replace(regexCreate, replacementCreate);

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('inventory.ts updated');
