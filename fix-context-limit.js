const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace(
  /orderBy: \{ createdAt: 'desc' \},\s*take: 100/g,
  "orderBy: { createdAt: 'desc' },\n        take: 20"
);

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Reduced admin context orders from 100 to 20 for faster module loading');
