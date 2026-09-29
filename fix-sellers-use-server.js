const fs = require('fs');
let s = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');
if (s.startsWith("import { logAuditEvent")) {
   s = s.replace("import { logAuditEvent, getAuditActor } from '@/lib/audit';\n'use server'", "'use server';\nimport { logAuditEvent, getAuditActor } from '@/lib/audit';");
}
fs.writeFileSync('src/app/actions/sellers.ts', s);
console.log("Fixed sellers use server");
