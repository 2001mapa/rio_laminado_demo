const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

code = code.replace(
  /export async function getAdminLatestOrderIds\(\) \{[\s\S]*?try \{/g,
  `export async function getAdminLatestOrderIds() {
  noStore();
  console.log('[POLL] getAdminLatestOrderIds called');
  try {`
);

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Added console.log to getAdminLatestOrderIds');
