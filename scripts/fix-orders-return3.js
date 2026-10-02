const fs = require('fs');
let content = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

content = content.replace(/return \{ success: false, error: error.message, code: error.code \};/g, 'return { success: false, error: error.message, code: error.code, conflicts: (error as any).conflicts };');

fs.writeFileSync('src/app/actions/orders.ts', content);
