const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

const regexPreviewStart = /let samples: \{ sku: string, name: string, material: string \}\[\] = \[\];\s*items\.forEach/;

const match = code.match(regexPreviewStart);
if (match) {
  const replacement = `let samples: { sku: string, name: string, material: string }[] = [];
    
    let warnings: string[] = [];
    const csvLocations = new Map<string, string[]>();
    
    items.forEach`;
  code = code.replace(regexPreviewStart, replacement);
}

const regexPush = /if \(samples\.length < 5\) \{\s*samples\.push\(\{ sku: item\.sku, name: item\.name, material: suggestedMaterial \}\);\s*\}/;
const matchPush = code.match(regexPush);
if (matchPush) {
  const replacement = `if (samples.length < 5) {
           samples.push({ sku: item.sku, name: item.name, material: suggestedMaterial });
        }
      }
      
      if (item.locationCode && typeof item.locationCode === 'string' && item.locationCode.trim() !== '') {
          const loc = item.locationCode.trim();
          if (!csvLocations.has(loc)) csvLocations.set(loc, []);
          csvLocations.get(loc)!.push(item.sku);
      }`;
  code = code.replace(regexPush, replacement);
}

const regexReturn = /return \{\s*success: true,\s*toCreate,\s*toUpdate,\s*errors,\s*stats,\s*samples,\s*message: undefined\s*\};/;
const matchReturn = code.match(regexReturn);
if (matchReturn) {
  const replacement = `const duplicateLocationsInCsv = Array.from(csvLocations.entries()).filter(([loc, skus]) => skus.length > 1);
    if (duplicateLocationsInCsv.length > 0) {
       warnings.push(\`El archivo CSV contiene \${duplicateLocationsInCsv.length} ubicación(es) asignadas a múltiples productos (ej. "\${duplicateLocationsInCsv[0][0]}").\`);
    }

    const activeLocationsInCsv = Array.from(csvLocations.keys());
    if (activeLocationsInCsv.length > 0) {
       const dbConflicts = await prisma.product.findMany({
          where: {
             locationCode: { in: activeLocationsInCsv },
             sku: { notIn: skus }
          },
          select: { locationCode: true, sku: true }
       });
       if (dbConflicts.length > 0) {
          warnings.push(\`Hay \${dbConflicts.length} producto(s) en el CSV cuya ubicación ya está ocupada por OTRA referencia en el sistema (ej. "\${dbConflicts[0].locationCode}").\`);
       }
    }
    
    return { 
      success: true, 
      toCreate, 
      toUpdate, 
      errors,
      warnings,
      stats,
      samples,
      message: undefined 
    };`;
  code = code.replace(regexReturn, replacement);
}

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('Modified inventory.ts for warnings');
