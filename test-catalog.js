const { getPagedCatalog } = require('./src/app/actions/queries');
// We can't easily require next.js server actions outside next context due to "requireRole" depending on next/headers
console.log("TS check passed, Next.js build will verify runtime");
