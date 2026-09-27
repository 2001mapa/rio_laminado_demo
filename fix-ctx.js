const fs = require('fs');
let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

const regex = /updateCartQuantity,\s*removeFromCart,/;
if (code.match(regex)) {
  code = code.replace(regex, 'updateCartQuantity,\n        updateCartItemSize,\n        removeFromCart,');
  fs.writeFileSync('src/lib/DemoContext.tsx', code);
  console.log('Fixed provider value');
} else {
  console.log('Not found');
}
