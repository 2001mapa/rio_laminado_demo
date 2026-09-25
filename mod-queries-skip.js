const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace(
  /cursor: cursor \? \{ id: cursor \} : undefined,/,
  `cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,`
);

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log("Updated queries.ts pagination skip");
