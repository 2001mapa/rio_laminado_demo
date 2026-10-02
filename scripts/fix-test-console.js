const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`    // Ignore console.error for unhandled rejections during test
    vi.spyOn(console, 'error').mockImplementation(() => {});`,
``
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
