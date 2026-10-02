const fs = require('fs');

let c = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

if (!c.includes('syncPendingOrders: (bypassUUID?: string) => Promise<void>')) {
  c = c.replace(/refreshData: \(\) => Promise<void>;/, "refreshData: () => Promise<void>;\n  syncPendingOrders: (bypassUUID?: string) => Promise<void>;");
  c = c.replace(/const \{ syncPendingOrders \} = useOfflineSync\(/, 'const { syncPendingOrders } = useOfflineSync('); // Ensure we catch it
  if (!c.includes('const { syncPendingOrders } = useOfflineSync')) {
     c = c.replace(/useOfflineSync\(async \(\) => \{ await refreshData\(\) \}\);/, "const { syncPendingOrders } = useOfflineSync(async () => { await refreshData() });");
  }
  c = c.replace(/refreshData,\n\s*updateGroupInvoice/, "refreshData,\n      syncPendingOrders,\n      updateGroupInvoice");
  fs.writeFileSync('src/lib/DemoContext.tsx', c);
}
