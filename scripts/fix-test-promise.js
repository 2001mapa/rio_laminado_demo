const fs = require('fs');
let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`mockDbPut.mockRejectedValue(new Error('QuotaExceededError'));`,
`mockDbPut.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));`
);

content = content.replace(
`mockDbDelete.mockRejectedValue(new Error('IDB Delete Error'));`,
`mockDbDelete.mockImplementation(() => Promise.reject(new Error('IDB Delete Error')));`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
