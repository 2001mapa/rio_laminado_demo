const fs = require('fs');
let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');

const queries = `
export async function searchOfflineProducts(query: string): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('catalog_products');
  const lowerQuery = query.toLowerCase();
  return all.filter(p => p.isActive && (p.sku.toLowerCase().includes(lowerQuery) || p.name.toLowerCase().includes(lowerQuery)));
}

export async function searchOfflineCustomers(query: string): Promise<CatalogCustomer[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('catalog_customers');
  const lowerQuery = query.toLowerCase();
  return all.filter(c => c.isActive && (c.name.toLowerCase().includes(lowerQuery) || (c.documentId && c.documentId.toLowerCase().includes(lowerQuery))));
}

export async function getOfflineProductsByIds(ids: string[]): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const tx = db.transaction('catalog_products', 'readonly');
  const products = [];
  for (const id of ids) {
    const p = await tx.store.get(id);
    if (p) products.push(p);
  }
  return products;
}
`;

content = content + '\n' + queries;

fs.writeFileSync('src/lib/offlineQueue.ts', content);
