const fs = require('fs');

let testContent = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');

testContent = testContent.replace(
  `      orderItem: {
        createMany: vi.fn()
      }`,
  `      orderItem: {
        createMany: vi.fn()
      },
      orderMaterialGroup: {
        create: vi.fn().mockResolvedValue({ id: 'group-1' })
      }`
);

fs.writeFileSync('__tests__/phase5-server.test.ts', testContent);
