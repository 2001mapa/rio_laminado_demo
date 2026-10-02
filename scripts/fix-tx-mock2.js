const fs = require('fs');

let testContent = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');
testContent = testContent.replace(
  `      auditEvent: {
        create: vi.fn()
      }`,
  `      auditEvent: {
        create: vi.fn()
      },
      orderItem: {
        createMany: vi.fn()
      }`
);
fs.writeFileSync('__tests__/phase5-server.test.ts', testContent);
