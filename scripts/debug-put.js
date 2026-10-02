const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`    mockDbPut.mockReset().mockImplementation(async (store, val, key) => {
      // simulate put
      if (store === 'drafts') dbStore.drafts[key || val.sellerId] = val;
      if (store === 'pending_orders') dbStore.pending_orders[val.clientRequestId] = val;
    });`,
`    mockDbPut.mockReset().mockImplementation(async (store, val, key) => {
      console.log(\`PUT \${store}:\`, val);
      if (store === 'drafts') dbStore.drafts[key || val.sellerId] = val;
      if (store === 'pending_orders') dbStore.pending_orders[val.clientRequestId] = val;
    });`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
