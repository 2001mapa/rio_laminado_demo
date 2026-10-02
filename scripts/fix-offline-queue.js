const fs = require('fs');
let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');

// Fix Product
content = content.replace(
`  isActive: boolean;
  updatedAt: number;
  imageUrl?: string | null;`,
`  isActive: boolean;
  imageUrl?: string | null;`
);

// Fix Customer
content = content.replace(
`export interface CatalogCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  updatedAt: number;
  isActive: boolean;
}`,
`export interface CatalogCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
}`
);

// Export getDB
content = content.replace(
`function getDB() {`,
`export function getDB() {`
);

// Fix searches
content = content.replace(
`export async function searchOfflineProducts(query: string): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('catalog_products');
  const lowerQuery = query.toLowerCase();
  return all.filter(p => p.isActive && (p.sku.toLowerCase().includes(lowerQuery) || p.name.toLowerCase().includes(lowerQuery)));
}`,
`export async function searchOfflineProducts(query: string): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const all = (await db.getAll('catalog_products')) as unknown as CatalogProduct[];
  const lowerQuery = query.toLowerCase();
  return all.filter(p => p.isActive && (p.sku.toLowerCase().includes(lowerQuery) || p.name.toLowerCase().includes(lowerQuery)));
}`
);

content = content.replace(
`export async function searchOfflineCustomers(query: string): Promise<CatalogCustomer[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('catalog_customers');
  const lowerQuery = query.toLowerCase();
  return all.filter(c => c.isActive && (c.name.toLowerCase().includes(lowerQuery) || (c.documentId && c.documentId.toLowerCase().includes(lowerQuery))));
}`,
`export async function searchOfflineCustomers(query: string): Promise<CatalogCustomer[]> {
  const db = await getDB();
  if (!db) return [];
  const all = (await db.getAll('catalog_customers')) as unknown as CatalogCustomer[];
  const lowerQuery = query.toLowerCase();
  return all.filter(c => c.status === 'active' && c.name.toLowerCase().includes(lowerQuery));
}`
);

content = content.replace(
`export async function getOfflineProductsByIds(ids: string[]): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const tx = db.transaction('catalog_products', 'readonly');
  const products = [];
  for (const id of ids) {
    const p = await tx.store.get(id);
    if (p) products.push(p);
  }
  return products;
}`,
`export async function getOfflineProductsByIds(ids: string[]): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const tx = db.transaction('catalog_products', 'readonly');
  const products = [];
  for (const id of ids) {
    const p = await tx.store.get(id);
    if (p) products.push(p as unknown as CatalogProduct);
  }
  return products;
}`
);

fs.writeFileSync('src/lib/offlineQueue.ts', content);
