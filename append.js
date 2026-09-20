const fs = require('fs');
const code = `
export async function previewCSVUpload(items: any[]) {
  await requireRole(['admin']);
  try {
    const skus = items.map(i => i.sku).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true }
    });
    
    const existingSkus = new Set(existingProducts.map(p => p.sku));
    
    let toCreate = 0;
    let toUpdate = 0;
    let errors: { row: number, error: string }[] = [];
    
    items.forEach((item, index) => {
      if (!item.sku) {
        errors.push({ row: index + 2, error: 'Falta SKU' });
        return;
      }
      
      const price = parseFloat(item.price?.toString().replace(/[^\\d.-]/g, ''));
      if (isNaN(price)) {
        errors.push({ row: index + 2, error: 'Precio inválido' });
        return;
      }
      
      if (existingSkus.has(item.sku)) {
        toUpdate++;
      } else {
        toCreate++;
      }
    });
    
    return { success: true, toCreate, toUpdate, errors };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
`;
fs.appendFileSync('src/app/actions/inventory.ts', code);
