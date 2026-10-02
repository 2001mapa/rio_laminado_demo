const fs = require('fs');
let content = fs.readFileSync('src/lib/useOfflineSync.ts', 'utf8');

content = content.replace(
`conflicts: res.conflicts`,
`conflicts: (res as any).conflicts`
);

fs.writeFileSync('src/lib/useOfflineSync.ts', content);
