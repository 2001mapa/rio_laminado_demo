const fs = require('fs');

let content = fs.readFileSync('__tests__/hydration.test.tsx', 'utf8');
content = content.replace(
  `loadDraft: vi.fn().mockImplementation(() => Promise.resolve(mockDraft))`,
  `loadDraft: vi.fn().mockImplementation(() => Promise.resolve(mockDraft)),
  getDB: async () => null,
  searchOfflineProducts: async () => [],
  searchOfflineCustomers: async () => [],
  getOfflineProductsByIds: async () => []`
);
fs.writeFileSync('__tests__/hydration.test.tsx', content);

let content2 = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');
if (!content2.includes('getDB: async () => null')) {
  content2 = content2.replace(
    `loadDraft: async () => null`,
    `loadDraft: async () => null,
  getDB: async () => null,
  searchOfflineProducts: async () => [],
  searchOfflineCustomers: async () => [],
  getOfflineProductsByIds: async () => []`
  );
  fs.writeFileSync('__tests__/idb-failures.test.tsx', content2);
}
