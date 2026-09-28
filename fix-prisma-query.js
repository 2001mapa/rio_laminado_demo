const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace("where: { locationCode: { not: null, not: '' } }", "where: { locationCode: { not: '' }, NOT: { locationCode: null } }");

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Fixed Prisma query');
