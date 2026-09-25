const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace(
  /materialSnapshot String\?/,
  "materialSnapshot String?\n  sizeDetails      Json?"
);

fs.writeFileSync('prisma/schema.prisma', code);
