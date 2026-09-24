const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

const updateFn = `
export async function updateProductAction(id: string, data: {
  sku?: string;
  name?: string;
  category?: string;
  price?: number;
  physicalStock?: number;
  locationCode?: string | null;
  material?: string;
  isActive?: boolean;
}) {
  try {
    await requireRole(['admin']);
    
    // Check if new sku is already used
    if (data.sku) {
       const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
       if (existing && existing.id !== id) {
          throw new Error('El SKU ya está en uso por otro producto.');
       }
    }
    
    await prisma.product.update({
      where: { id },
      data: {
        ...(data.sku && { sku: data.sku }),
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.physicalStock !== undefined && { physicalStock: data.physicalStock }),
        ...(data.locationCode !== undefined && { locationCode: data.locationCode }),
        ...(data.material && { material: data.material }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });

    return { success: true, message: 'Producto actualizado exitosamente.' };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, message: error.message || 'Error interno al actualizar el producto.' };
  }
}
`;

code += updateFn;
fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('inventory updated');
