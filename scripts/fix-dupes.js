const fs = require('fs');

let testContent = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');

// The file has a duplicate findFirst in the first order block
testContent = testContent.replace(
  `    order: {
      create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }),
      findFirst: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null)
    },`,
  `    order: {
      create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }),
      findFirst: vi.fn().mockResolvedValue(null)
    },`
);

// Where's the other duplicate?
// error TS1117: An object literal cannot have multiple properties with the same name.
// line 62,7: error TS1117
// Let's check line 62 of phase5-server.test.ts

fs.writeFileSync('__tests__/phase5-server.test.ts', testContent);
