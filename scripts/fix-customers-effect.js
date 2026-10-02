const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// Replace the buggy offlineCustomers useEffect
const buggyEffect = `  const effectiveCustomers = customers.length > 0 ? customers : offlineCustomers;
  useEffect(() => {
    if (customers.length === 0) {
      searchOfflineCustomers('', sellerId).then(res => setOfflineCustomers(res as any));
    }
  }, [customers]);`;

const correctEffect = `  const effectiveCustomers = customers.length > 0 ? customers : offlineCustomers;
  useEffect(() => {
    setOfflineCustomers([]);
    if (customers.length === 0 && sellerId) {
      searchOfflineCustomers('', sellerId).then(res => setOfflineCustomers(res as any));
    }
  }, [customers, sellerId]);`;

content = content.replace(buggyEffect, correctEffect);

// And we must pass sellerId to getOfflineProductsByIds inside PwaUpdater, wait, no, inside page.tsx hydrate
content = content.replace(
  `getOfflineProductsByIds(missingIds).then(offlineRes => {`,
  `getOfflineProductsByIds(missingIds, sellerId).then(offlineRes => {`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
