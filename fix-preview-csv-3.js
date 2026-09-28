const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

const newPreviewFn = `export async function previewCSVUpload(items: any[]) {
  try {
    await requireRole(['admin']);
    const skus = items.map(i => i.sku).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, material: true, locationCode: true }
    });
    
    const existingMap = new Map(existingProducts.map(p => [p.sku, p]));
    
    let toCreate = 0;
    let toUpdate = 0;
    let errors: { row: number, error: string }[] = [];
    let warnings: string[] = [];
    const csvLocations = new Map<string, string[]>();
    
    let stats = {
       laminado: 0,
       plata: 0,
       rodio: 0,
       revisar: 0
    };
    
    let samples: { sku: string, name: string, material: string }[] = [];
    
    items.forEach((item, index) => {
      const rowNum = index + 2;
      
      if (!item.sku) {
        errors.push({ row: rowNum, error: 'Falta SKU' });
        return;
      }
      
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\\d.-]/g, ''));
      if (isNaN(price)) {
        errors.push({ row: rowNum, error: 'Precio inválido' });
        return;
      }
      
      const physicalStockStr = item.physicalStock ? item.physicalStock.toString() : '0';
      const physicalStock = parseInt(physicalStockStr, 10);
      if (isNaN(physicalStock) || physicalStock < 0) {
        errors.push({ row: rowNum, error: 'Stock inválido' });
        return;
      }
      
      const normalizedCategory = normalizeProductType(item.category || '');
      if (!OFFICIAL_PRODUCT_TYPES.includes(normalizedCategory)) {
        errors.push({ row: rowNum, error: \`Tipo de producto inválido: "\${item.category}". Tipos válidos: \${OFFICIAL_PRODUCT_TYPES.join(', ')}\` });
        return;
      }
      
      const suggestedMaterial = detectMaterial(item.name || '');
      
      if (existingMap.has(item.sku)) {
        toUpdate++;
      } else {
        toCreate++;
        if (suggestedMaterial === 'Laminado') stats.laminado++;
        else if (suggestedMaterial === 'Plata') stats.plata++;
        else if (suggestedMaterial === 'Rodio') stats.rodio++;
        else stats.revisar++;
        
        if (samples.length < 5) {
           samples.push({ sku: item.sku, name: item.name, material: suggestedMaterial });
        }
      }

      if (item.locationCode && typeof item.locationCode === 'string' && item.locationCode.trim() !== '') {
          const loc = item.locationCode.trim();
          if (!csvLocations.has(loc)) csvLocations.set(loc, []);
          csvLocations.get(loc).push(item.sku);
      }
    });

    const duplicateLocationsInCsv = Array.from(csvLocations.entries()).filter(([loc, skus]) => skus.length > 1);
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

    // DUPLICATE REFERENCES (SKUS) WARNING:
    const csvSkus = new Set<string>();
    let duplicateSkusCount = 0;
    let sampleDupSku = '';
    items.forEach(item => {
        if (item.sku) {
            if (csvSkus.has(item.sku)) {
                duplicateSkusCount++;
                if (!sampleDupSku) sampleDupSku = item.sku;
            } else {
                csvSkus.add(item.sku);
            }
        }
    });

    if (duplicateSkusCount > 0) {
        warnings.push(\`El archivo CSV contiene \${duplicateSkusCount} fila(s) con un SKU repetido (ej. "\${sampleDupSku}"). Se guardará solo la última fila leída.\`);
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
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}`;

const startIdx = code.indexOf('export async function previewCSVUpload(items: any[]) {');

if (startIdx !== -1) {
  code = code.substring(0, startIdx) + newPreviewFn + '\n';
  fs.writeFileSync('src/app/actions/inventory.ts', code);
  console.log('Fixed previewCSVUpload to end of file!');
} else {
  console.log('Could not find startIdx');
}
