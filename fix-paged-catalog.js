const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const targetLogic = `    const where: any = { ...baseWhere };
    if (material && material !== 'Todos') {
      where.material = material;
    }`;

// Notice: In the previous attempt the target was:
// "    const where: any = { ...baseWhere };\n    if (material && material !== 'Todos') {\n      where.material = material;\n    }"
// Let's use string operations instead of exact replace to be safe.

const startStr = "const where: any = { ...baseWhere };";
const endStr = "let finalItems: any[] = [];"; // The next meaningful line

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newLogic = `const where: any = { ...baseWhere };
    if (material === 'Por revisar' && role === 'admin') {
      // "Por revisar" en admin funciona como filtro integral de revisión:
      // Material desconocido, ubicaciones duplicadas, o sin ubicación
      const duplicates = await prisma.product.groupBy({
        by: ['locationCode'],
        where: { locationCode: { not: '' }, NOT: { locationCode: null } },
        having: { locationCode: { _count: { gt: 1 } } }
      });
      const dupCodes = duplicates.map(d => d.locationCode).filter(Boolean) as string[];

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
    }

    // Paginación continua saltando agotados
    `;
    
  code = code.substring(0, startIdx) + newLogic + code.substring(endIdx);
  fs.writeFileSync('src/app/actions/queries.ts', code);
  console.log('Successfully injected getPagedCatalog Por revisar logic!');
} else {
  console.log('Failed to find indices');
}
