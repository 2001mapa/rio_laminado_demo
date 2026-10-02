const fs = require('fs');
let content = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

content = content.replace(
  `        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code };
        }`,
  `        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code, conflicts: (error as any).conflicts };
        }`
);

fs.writeFileSync('src/app/actions/orders.ts', content);
