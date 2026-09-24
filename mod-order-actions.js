const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

code = code.replace(
  "if (action === 'SEND_TO_VERIFICATION' || action === 'PACK' || action === 'DISPATCH')",
  "if (action === 'PACK' || action === 'DISPATCH')"
);

fs.writeFileSync('src/app/actions/orders.ts', code);
console.log('Fixed verification blocker in actions');
