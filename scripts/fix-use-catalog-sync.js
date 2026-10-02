const fs = require('fs');
let content = fs.readFileSync('src/lib/useCatalogSync.ts', 'utf8');

content = content.replace(
`await tx.store.put(c as CatalogCustomer);`,
`await tx.store.put(c as unknown as CatalogCustomer);`
);

content = content.replace(
`await tx.store.put(p as CatalogProduct);`,
`await tx.store.put(p as unknown as CatalogProduct);`
);

fs.writeFileSync('src/lib/useCatalogSync.ts', content);
