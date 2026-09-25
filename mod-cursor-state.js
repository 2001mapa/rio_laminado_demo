const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

code = code.replace(
  /setCursor\(res\.cursor\);/,
  `setCursor(res.nextCursor);`
);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log("Updated client page cursor assignment");
