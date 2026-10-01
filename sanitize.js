const fs = require('fs');

function sanitize(file) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/postgresql:\/\/[^"']+/g, 'postgresql://***:***@***');
  fs.writeFileSync(file, c);
}

sanitize('__tests__/test-idempotency.ts');
sanitize('dist-test/__tests__/test-idempotency.js');
sanitize('__tests__/test-idempotency.js');

console.log("Sanitized local files.");
