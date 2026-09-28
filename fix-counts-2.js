const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const newFn = `export async function getAdminMaterialCounts() {
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
      if (mat === 'Laminado') result.Laminado = c._count.id;
      else if (mat === 'Plata') result.Plata = c._count.id;
      else if (mat === 'Rodio') result.Rodio = c._count.id;
    });

    const duplicates = await prisma.product.groupBy({
      by: ['locationCode'],
      where: { locationCode: { not: '' }, NOT: { locationCode: null } },
      having: { locationCode: { _count: { gt: 1 } } }
    });
    const dupCodes = duplicates.map(d => d.locationCode);

    const porRevisarCount = await prisma.product.count({
      where: {
        OR: [
          { material: 'Por revisar' },
          { locationCode: null },
          { locationCode: '' },
          { imageUrl: null },
          ...(dupCodes.length > 0 ? [{ locationCode: { in: dupCodes } }] : [])
        ]
      }
    });
    
    result['Por revisar'] = porRevisarCount;

    return { success: true, counts: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}`;

const startIdx = code.indexOf('export async function getAdminMaterialCounts() {');
const endIdx = code.indexOf('export async function getPrintableProducts() {', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newFn + '\n\n' + code.substring(endIdx);
  fs.writeFileSync('src/app/actions/queries.ts', code);
  console.log('Successfully replaced getAdminMaterialCounts!');
} else {
  console.log('Failed to find indices');
}
