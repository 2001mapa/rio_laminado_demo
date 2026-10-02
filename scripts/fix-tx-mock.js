const fs = require('fs');

let content = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');

content = content.replace(
  `product: {
        update: (...args: any) => {`,
  `product: {
        findUnique: (...args: any) => mockPrismaFindUnique(...args),
        update: (...args: any) => {`
);

fs.writeFileSync('__tests__/phase5-server.test.ts', content);
