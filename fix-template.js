const fs = require('fs');
let c = fs.readFileSync('__tests__/test-idempotency.ts', 'utf8');

c = c.replace(
  'await testPrisma.$executeRawUnsafe(\\`DROP SCHEMA public CASCADE; CREATE SCHEMA public;\\`);',
  'await testPrisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);'
);

c = c.replace(
  'await testPrisma.$executeRawUnsafe(\\`DROP SCHEMA "\\${schema}" CASCADE;\\`);',
  'await testPrisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE;`);'
);

fs.writeFileSync('__tests__/test-idempotency.ts', c);
