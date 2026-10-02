const fs = require('fs');

let content = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');

content = content.replace(
  `product: {`,
  `customer: { findUnique: vi.fn().mockResolvedValue({ id: 'cust-1', name: 'Mock Customer' }) },
    product: {`
);

fs.writeFileSync('__tests__/phase5-server.test.ts', content);
