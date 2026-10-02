const fs = require('fs');

let testContent = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');

testContent = testContent.replace(
  `        findFirst: vi.fn().mockResolvedValue(null)
      },`,
  `        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' })
      },`
);

fs.writeFileSync('__tests__/phase5-server.test.ts', testContent);
