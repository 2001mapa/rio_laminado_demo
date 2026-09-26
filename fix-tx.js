const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

const newUpdateProductAction = `export async function updateProductAction(id: string, data: {
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
    const actor = await getAuditActor();
    if (actor.role !== 'admin') throw new Error('No autorizado');
    
    const before = await prisma.product.findUnique({ where: { id } });
    if (!before) throw new Error('Producto no encontrado');

    if (data.sku) {
       const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
       if (existing && existing.id !== id) {
          throw new Error('El SKU ya está en uso por otro producto.');
       }
    }
    
    const after = await prisma.product.update({
      where: { id },
      data: {
        ...(data.sku && { sku: data.sku }),
        ...(data.name && { name: data.name }),
        ...(data.category && { category: normalizeProductType(data.category) }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.physicalStock !== undefined && { physicalStock: data.physicalStock }),
        ...(data.locationCode !== undefined && { locationCode: data.locationCode }),
        ...(data.material && { material: data.material }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });

    await logAuditEvent(actor, {
      action: 'UPDATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: id,
      sku: after.sku,
      origin: 'admin_dashboard',
      changes: { before, after }
    });

    return { success: true, message: 'Producto actualizado exitosamente.' };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, message: error.message || 'Error interno al actualizar el producto.' };
  }
}`;

code = code.replace(/export async function updateProductAction\([\s\S]*?message: error\.message \|\| 'Error interno al actualizar el producto\.' \};\n  \}\n\}/, newUpdateProductAction);

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('Fixed updateProductAction by removing interactive transaction');
