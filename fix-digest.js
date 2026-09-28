const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const oldDigest = `export async function getClientActiveProductsDigest() {
  noStore();
  try {
    const { role } = await requireRole(['cliente']);
    if (role !== 'cliente') return { success: false };
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, physicalStock: true, reservedStock: true }
    });
    return { success: true, products: products.map(p => ({
      id: p.id,
      physicalStock: p.physicalStock,
      reservedStock: p.reservedStock
    })) };
  } catch (error: any) {
    return { success: false };
  }
}`;

const newDigest = `export async function getClientActiveProductsDigest() {
  noStore();
  try {
    const { role } = await requireRole(['cliente']);
    if (role !== 'cliente') return { success: false };
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        imageUrl: { not: null },
        material: { not: 'Por revisar' }
      },
      select: { id: true, physicalStock: true, reservedStock: true }
    });
    // Y para el cliente, solo nos importa el stock real disponible
    const filteredProducts = products.filter(p => (p.physicalStock - p.reservedStock) > 0);
    
    return { success: true, products: filteredProducts.map(p => ({
      id: p.id,
      physicalStock: p.physicalStock,
      reservedStock: p.reservedStock
    })) };
  } catch (error: any) {
    return { success: false };
  }
}`;

code = code.replace(oldDigest, newDigest);
fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Fixed getClientActiveProductsDigest filters');
