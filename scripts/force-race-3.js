const fs = require('fs');

let content = fs.readFileSync('__tests__/phase4.test.ts', 'utf8');
content = content.replace(
`                    getItemCalls++;
                    if (getItemCalls <= 2) return null;`,
`                    getItemCalls++;
                    console.log("getItem called", getItemCalls);
                    if (getItemCalls <= 2) return null;`
);

fs.writeFileSync('__tests__/phase4.test.ts', content);
