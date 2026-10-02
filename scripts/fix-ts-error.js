const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`fireEvent.submit(searchInput.closest('form'));`,
`fireEvent.submit(searchInput.closest('form')!);`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
