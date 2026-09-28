const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const targetCounts = `    counts.forEach(c => {
      const mat = c.material || 'Por revisar';
      if (result[mat] !== undefined) {
         result[mat] = c._count.id;
      } else {
         result['Por revisar'] += c._count.id; // Any weird material falls into "Por revisar" or is ignored
      }
    });

    return { success: true, counts: result };`;

const replaceCounts = `    counts.forEach(c => {
      const mat = c.material || 'Por revisar';
      if (mat === 'Laminado') result.Laminado = c._count.id;
      else if (mat === 'Plata') result.Plata = c._count.id;
      else if (mat === 'Rodio') result.Rodio = c._count.id;
    });

    // Calcular "Por revisar" con los criterios integrales
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

    return { success: true, counts: result };`;

code = code.replace(targetCounts, replaceCounts);
fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Fixed getAdminMaterialCounts');
