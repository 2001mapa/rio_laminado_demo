const fs = require('fs');

let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

code = code.replace(
  /\/\/ Optional: rollback optimistic update if needed/g,
  'await refreshData(); // rollback optimistic update'
);

code = code.replace(
  /console\.error\('Error creating customer in DB:', error\);\s*\}/g,
  "console.error('Error creating customer in DB:', error);\n      await refreshData();\n    }"
);

fs.writeFileSync('src/lib/DemoContext.tsx', code);
console.log('DemoContext rollbacks added');
