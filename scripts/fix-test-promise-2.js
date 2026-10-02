const fs = require('fs');
let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`mockDbPut.mockReturnValue(Promise.reject(new Error('QuotaExceededError')));`,
`mockDbPut.mockImplementation(async () => { throw new Error('QuotaExceededError') });`
);

content = content.replace(
`mockDbDelete.mockReturnValue(Promise.reject(new Error('IDB Delete Error')));`,
`mockDbDelete.mockImplementation(async () => { throw new Error('IDB Delete Error') });`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
