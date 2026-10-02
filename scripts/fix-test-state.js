const fs = require('fs');
let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

// Use a proper stateful mock for IDB
const oldSetup = 
`  beforeEach(() => {
    mockDbPut.mockReset().mockResolvedValue(undefined);
    mockDbDelete.mockReset().mockResolvedValue(undefined);
    mockDbGet.mockReset().mockResolvedValue(undefined);
    mockDbGetAllFromIndex.mockReset().mockResolvedValue([]);
    addToastMock.mockClear();
    
    // Ignore console.error for unhandled rejections during test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });`;

const newSetup = 
`  let addedOrders: any[] = [];
  beforeEach(() => {
    addedOrders = [];
    mockDbPut.mockReset().mockImplementation(async (store, val) => {
      if (store === 'pending_orders') addedOrders.push(val);
    });
    mockDbDelete.mockReset().mockImplementation(async () => {});
    mockDbGet.mockReset().mockImplementation(async () => undefined);
    mockDbGetAllFromIndex.mockReset().mockImplementation(async () => addedOrders);
    addToastMock.mockClear();
  });`;

content = content.replace(oldSetup, newSetup);

// Fix Test 1
content = content.replace(
`mockDbPut.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));`,
`mockDbPut.mockImplementation(async () => { throw new Error('QuotaExceededError') });`
);

// Fix Test 2
content = content.replace(
`      mockDbPut.mockResolvedValue(undefined);
      
      // SOLO falla delete!
      mockDbDelete.mockImplementation(() => Promise.reject(new Error('IDB Delete Error')));`,
`      mockDbPut.mockImplementation(async (store, val) => {
         if (store === 'pending_orders') addedOrders.push(val);
      });
      // SOLO falla delete!
      mockDbDelete.mockImplementation(async () => { throw new Error('IDB Delete Error') });`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
