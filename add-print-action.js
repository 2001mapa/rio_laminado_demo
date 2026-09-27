const fs = require('fs');

let queriesCode = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const getPrintableProductsCode = `
export async function getPrintableProducts() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };

    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        material: true,
        price: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;

if (!queriesCode.includes('getPrintableProducts')) {
  queriesCode += getPrintableProductsCode;
  fs.writeFileSync('src/app/actions/queries.ts', queriesCode);
  console.log('Added getPrintableProducts to queries.ts');
} else {
  console.log('getPrintableProducts already exists');
}
