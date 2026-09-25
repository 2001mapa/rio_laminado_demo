const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace(
  /const products = await prisma\.product\.findMany\(\{\s*where: role !== 'admin' \? \{ isActive: true \} : undefined\s*\}\);/,
  `const products = role === 'admin' ? await prisma.product.findMany({ orderBy: { createdAt: 'desc' } }) : [];`
);

fs.writeFileSync('src/app/actions/queries.ts', code);
