const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace(
  "export async function getPagedCatalog({ \n  material, \n  category, \n  search, \n  limit = 24, \n  cursor \n}: {",
  "export async function getPagedCatalog({ \n  material, \n  category, \n  search, \n  limit = 24, \n  cursor,\n  location \n}: {"
);
code = code.replace(
  "cursor?: string;\n}) {",
  "cursor?: string;\n  location?: string;\n}) {"
);

// Add location filtering logic
const targetSearch = `    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }`;
const replaceSearch = `    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (location && location !== 'Todas') {
      if (location === 'Sin ubicación') {
        baseWhere.OR = [
          ...(baseWhere.OR || []),
          { locationCode: null },
          { locationCode: '' }
        ];
      } else {
        baseWhere.locationCode = location;
      }
    }`;

code = code.replace(targetSearch, replaceSearch);
fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Added location to getPagedCatalog');
