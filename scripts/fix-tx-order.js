const fs = require('fs');

let testContent = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');

testContent = testContent.replace(
  `      order: {
        create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' })
      }`,
  `      order: {
        create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }),
        findFirst: vi.fn().mockResolvedValue(null)
      }`
);

fs.writeFileSync('__tests__/phase5-server.test.ts', testContent);
