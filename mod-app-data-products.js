const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace(
  /const products = role === 'admin' \? await prisma\.product\.findMany\(\{ orderBy: \{ createdAt: 'desc' \} \}\) : \[\];/,
  `// Products are now fetched via server-side pagination for ALL roles to save memory
      const products: any[] = [];`
);

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log("Empty products in getAppData for Admin");
