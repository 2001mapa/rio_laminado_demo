const fs = require('fs');
let code = fs.readFileSync('src/lib/order-status.ts', 'utf8');

code = code.replace(
  /'Tu pedido ha sido enviado, en un momento un asesor se comunicar.*? contigo para enviarte la gu.*?a\.'/,
  "'¡Tu pedido ha sido enviado! Aquí abajo puedes ver tu número de rastreo, y en un momento nos comunicaremos contigo para enviarte la foto de la guía física.'"
);

fs.writeFileSync('src/lib/order-status.ts', code);
console.log('Updated message');
