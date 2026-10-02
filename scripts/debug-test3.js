const fs = require('fs');
let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`      await waitFor(() => {
         expect(Object.keys(dbStore.pending_orders).length).toBe(1);
         expect(dbStore.drafts['seller-1']).toBeDefined();
         expect(dbStore.drafts['seller-1'].clientRequestId).toBeDefined();
      });`,
`      await waitFor(() => {
         console.log('dbStore keys:', Object.keys(dbStore.pending_orders));
         console.log('dbStore drafts:', dbStore.drafts);
         expect(Object.keys(dbStore.pending_orders).length).toBe(1);
         expect(dbStore.drafts['seller-1']).toBeDefined();
         expect(dbStore.drafts['seller-1'].clientRequestId).toBeDefined();
      });`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
