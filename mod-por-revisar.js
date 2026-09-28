const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const targetStr = `    const where: any = { ...baseWhere };
    if (material && material !== 'Todos') {
      where.material = material;
    }`;

const replaceStr = `    const where: any = { ...baseWhere };
    if (material === 'Por revisar' && role === 'admin') {
      // "Por revisar" en admin funciona como filtro integral de revisión:
      // Material desconocido, ubicaciones duplicadas, o sin ubicación
      const duplicates = await prisma.product.groupBy({
        by: ['locationCode'],
        where: { locationCode: { not: '' }, NOT: { locationCode: null } },
        having: { locationCode: { _count: { gt: 1 } } }
      });
      const dupCodes = duplicates.map(d => d.locationCode);

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { material: 'Por revisar' },
            { locationCode: null },
            { locationCode: '' },
            { imageUrl: null },
            ...(dupCodes.length > 0 ? [{ locationCode: { in: dupCodes } }] : [])
          ]
        }
      ];
    } else if (material && material !== 'Todos') {
      where.material = material;
    }`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Fixed getPagedCatalog for Por Revisar');
