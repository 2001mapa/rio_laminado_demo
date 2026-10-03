const fs = require('fs');
let clients = fs.readFileSync('src/app/actions/clients.ts', 'utf8');

const regex = /await logAuditEvent\(\{\s*actorId: actor\.id,\s*actorName: actor\.name,\s*actorRole: actor\.role,\s*action: 'UPDATE',/m;
const replacement = `await logAuditEvent(actor, {
      action: 'UPDATE',`;

clients = clients.replace(regex, replacement);

fs.writeFileSync('src/app/actions/clients.ts', clients);
