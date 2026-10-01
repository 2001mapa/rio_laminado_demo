const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
c = c.replace(/clientRequestId String\? @unique\\n  originalPayload Json\?/, 'clientRequestId String? @unique\n  originalPayload Json?');
fs.writeFileSync('prisma/schema.prisma', c);
