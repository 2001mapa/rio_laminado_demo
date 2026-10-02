const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

const regex = /expect\(dbStore\.drafts\['seller-1'\]\.clientRequestId\)\.toBe\(uuidGenerado\);/;

const replacement = `expect(dbStore.drafts['seller-1']).toBeUndefined(); // Se limpió tras el éxito`;

content = content.replace(regex, replacement);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
