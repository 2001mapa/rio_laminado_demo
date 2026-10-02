const fs = require('fs');
let content = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

content = content.replace(
  `        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code };
        }`,
  `        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code, conflicts: (error as any).conflicts };
        }`
);

// We also need to fix tx.order.findFirst is not a function inside phase5-server.test.ts
// Wait, tx.order is used: tx.order.findFirst? Let's check where tx.order.findFirst is called.

fs.writeFileSync('src/app/actions/orders.ts', content);

let testContent = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');
testContent = testContent.replace(
  `create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' })`,
  `create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }),
        findFirst: vi.fn().mockResolvedValue(null)`
);
testContent = testContent.replace(
  `create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' })`,
  `create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }),
      findFirst: vi.fn().mockResolvedValue(null)`
);
fs.writeFileSync('__tests__/phase5-server.test.ts', testContent);
