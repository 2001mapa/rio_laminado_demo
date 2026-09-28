const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

const target1 = `let samples: { sku: string, name: string, material: string }[] = [];
    
    items.forEach`;
const repl1 = `let samples: { sku: string, name: string, material: string }[] = [];
    
    let warnings: string[] = [];
    const csvLocations = new Map<string, string[]>();
    
    items.forEach`;
code = code.replace(target1, repl1);

const target2 = `        if (samples.length < 5) {
           samples.push({ sku: item.sku, name: item.name, material: suggestedMaterial });
        }
      }
    });`;
const repl2 = `        if (samples.length < 5) {
           samples.push({ sku: item.sku, name: item.name, material: suggestedMaterial });
        }
      }
      
      if (item.locationCode && typeof item.locationCode === 'string' && item.locationCode.trim() !== '') {
          const loc = item.locationCode.trim();
          if (!csvLocations.has(loc)) csvLocations.set(loc, []);
          csvLocations.get(loc)!.push(item.sku);
      }
    });`;
code = code.replace(target2, repl2);

const target3 = `return { 
      success: true, 
      toCreate, 
      toUpdate, 
      errors, 
      stats,
      samples,
      message: undefined 
    };`;
const repl3 = `const duplicateLocationsInCsv = Array.from(csvLocations.entries()).filter(([loc, skus]) => skus.length > 1);
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
code = code.replace(target3, repl3);

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('Fixed inventory.ts');
