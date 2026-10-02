const fs = require('fs');
let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');

// searchOfflineProducts
content = content.replace(
  `export async function searchOfflineProducts(query: string): Promise<CatalogProduct[]> {`,
  `export async function searchOfflineProducts(query: string, sellerId?: string): Promise<CatalogProduct[]> {`
);
content = content.replace(
  `const all = (await db.getAll('catalog_products')) as unknown as CatalogProduct[];`,
  `const meta = await db.get('sync_meta', 'lastSellerId');
    if (meta && meta.lastSyncedAt !== sellerId) return [];
    const all = (await db.getAll('catalog_products')) as unknown as CatalogProduct[];`
);

// searchOfflineCustomers
content = content.replace(
  `export async function searchOfflineCustomers(query: string): Promise<CatalogCustomer[]> {`,
  `export async function searchOfflineCustomers(query: string, sellerId?: string): Promise<CatalogCustomer[]> {`
);
content = content.replace(
  `const all = (await db.getAll('catalog_customers')) as unknown as CatalogCustomer[];`,
  `const meta = await db.get('sync_meta', 'lastSellerId');
    if (meta && meta.lastSyncedAt !== sellerId) return [];
    const all = (await db.getAll('catalog_customers')) as unknown as CatalogCustomer[];`
);

// getOfflineProductsByIds
content = content.replace(
  `export async function getOfflineProductsByIds(ids: string[]): Promise<CatalogProduct[]> {`,
  `export async function getOfflineProductsByIds(ids: string[], sellerId?: string): Promise<CatalogProduct[]> {`
);
content = content.replace(
  `const all = [];`,
  `const meta = await db.get('sync_meta', 'lastSellerId');
    if (meta && meta.lastSyncedAt !== sellerId) return [];
    const all = [];`
);

fs.writeFileSync('src/lib/offlineQueue.ts', content);
