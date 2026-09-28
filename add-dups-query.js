const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const newFn = `export async function getDuplicateLocationsCount() {
  noStore();
  try {
    const { role } = await requireRole(['admin']);
    if (role !== 'admin') return { success: false, count: 0 };
    
    // Group by locationCode having count > 1
    const duplicates = await prisma.product.groupBy({
      by: ['locationCode'],
      where: { locationCode: { not: null, not: '' } },
      having: {
        locationCode: { _count: { gt: 1 } }
      }
    });
    
    return { success: true, count: duplicates.length };
  } catch (error) {
    console.error('Error fetching duplicate locations:', error);
    return { success: false, count: 0 };
  }
}
`;

code += '\\n\\n' + newFn;
fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Added getDuplicateLocationsCount');
