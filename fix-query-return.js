const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace("return { success: true, count: duplicates.length };", "return { success: true, count: duplicates.length, locations: duplicates.map(d => d.locationCode) };");

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Fixed queries.ts');
