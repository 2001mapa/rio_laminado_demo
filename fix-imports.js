const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

if (!code.includes('import { logAuditEvent')) {
  code = code.replace(
    /import \{ prisma \} from '@\/lib\/prisma'/,
    `import { prisma } from '@/lib/prisma'\nimport { logAuditEvent, getAuditActor } from '@/lib/audit'`
  );
  fs.writeFileSync('src/app/actions/inventory.ts', code);
  console.log('Added imports to inventory.ts');
}
