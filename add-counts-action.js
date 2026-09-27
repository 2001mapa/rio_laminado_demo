const fs = require('fs');

let queriesCode = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const getAdminMaterialCountsCode = `
export async function getAdminMaterialCounts() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false };

    const counts = await prisma.product.groupBy({
      by: ['material'],
      _count: { id: true }
    });

    const total = await prisma.product.count();

    const result: Record<string, number> = {
      Todos: total,
      Laminado: 0,
      Plata: 0,
      Rodio: 0,
      'Por revisar': 0
    };

    counts.forEach(c => {
      const mat = c.material || 'Por revisar';
      if (result[mat] !== undefined) {
         result[mat] = c._count.id;
      } else {
         result['Por revisar'] += c._count.id; // Any weird material falls into "Por revisar" or is ignored
      }
    });

    return { success: true, counts: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;

if (!queriesCode.includes('getAdminMaterialCounts')) {
  queriesCode += getAdminMaterialCountsCode;
  fs.writeFileSync('src/app/actions/queries.ts', queriesCode);
  console.log('Added getAdminMaterialCounts to queries.ts');
} else {
  console.log('getAdminMaterialCounts already exists');
}
