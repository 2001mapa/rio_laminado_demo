const fs = require('fs');

const files = ['__tests__/page-ui.test.tsx', '__tests__/idb-failures.test.tsx', '__tests__/hydration.test.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    `loadDraft: async () => null`,
    `loadDraft: async () => null,
  getDB: async () => null,
  searchOfflineProducts: async () => [],
  searchOfflineCustomers: async () => [],
  getOfflineProductsByIds: async () => []`
  );
  content = content.replace(
    `loadDraft: async () => ({ cart: [{productId: 'p1', quantity: 2}], selectedClientId: 'c1' })`,
    `loadDraft: async () => ({ cart: [{productId: 'p1', quantity: 2}], selectedClientId: 'c1' }),
  getDB: async () => null,
  searchOfflineProducts: async () => [],
  searchOfflineCustomers: async () => [],
  getOfflineProductsByIds: async () => []`
  );
  fs.writeFileSync(file, content);
}
