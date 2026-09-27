const fs = require('fs');

let queries = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const newFunction = `
export async function getExactProductBySku(sku: string) {
  noStore();
  try {
    const { role } = await requireRole(['admin', 'vendedor']);
    
    const normalizedSku = sku.trim().toUpperCase();
    
    const product = await prisma.product.findFirst({
      where: { sku: normalizedSku }
    });

    if (!product) {
      return { success: false, reason: 'not_found', error: 'Referencia inexistente.' };
    }

    if (product.status !== 'active') {
      return { success: false, reason: 'inactive', error: 'El producto se encuentra inactivo.' };
    }

    if (product.physicalStock <= 0) {
      return { success: false, reason: 'out_of_stock', error: 'El producto está agotado.' };
    }

    return { success: true, product };
  } catch (error: any) {
    console.error('Error buscando producto por SKU:', error);
    return { success: false, reason: 'server_error', error: error.message };
  }
}
`;

fs.appendFileSync('src/app/actions/queries.ts', newFunction);
console.log('Appended getExactProductBySku');
