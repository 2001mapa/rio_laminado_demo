const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace(
  /if \(category && category !== 'Todos'\) \{\s*where\.category = category;\s*\}/,
  `if (category && category !== 'Todos') {
        if (!search) {
          where.category = { gte: category };
        } else {
          where.category = category;
        }
      }`
);

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log("Updated queries.ts to use gte for categories");
