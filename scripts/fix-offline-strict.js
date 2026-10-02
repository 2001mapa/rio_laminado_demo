const fs = require('fs');
let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');

content = content.replace(
  `export async function searchOfflineProducts(query: string, sellerId?: string): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const meta = await db.get('sync_meta', 'lastSellerId');
    if (meta && meta.lastSyncedAt !== sellerId) return [];`,
  `export async function searchOfflineProducts(query: string, sellerId: string): Promise<CatalogProduct[]> {
  if (!sellerId) return [];
  const db = await getDB();
  if (!db) return [];
  const meta = await db.get('sync_meta', 'lastSellerId');
  if (!meta || meta.lastSyncedAt !== sellerId) return [];`
);

content = content.replace(
  `export async function searchOfflineCustomers(query: string, sellerId?: string): Promise<CatalogCustomer[]> {
  const db = await getDB();
  if (!db) return [];
  const meta = await db.get('sync_meta', 'lastSellerId');
    if (meta && meta.lastSyncedAt !== sellerId) return [];`,
  `export async function searchOfflineCustomers(query: string, sellerId: string): Promise<CatalogCustomer[]> {
  if (!sellerId) return [];
  const db = await getDB();
  if (!db) return [];
  const meta = await db.get('sync_meta', 'lastSellerId');
  if (!meta || meta.lastSyncedAt !== sellerId) return [];`
);

content = content.replace(
  `export async function getOfflineProductsByIds(ids: string[], sellerId?: string): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const tx = db.transaction('catalog_products', 'readonly');`,
  `export async function getOfflineProductsByIds(ids: string[], sellerId: string): Promise<CatalogProduct[]> {
  if (!sellerId) return [];
  const db = await getDB();
  if (!db) return [];
  const meta = await db.get('sync_meta', 'lastSellerId');
  if (!meta || meta.lastSyncedAt !== sellerId) return [];
  const tx = db.transaction('catalog_products', 'readonly');`
);

fs.writeFileSync('src/lib/offlineQueue.ts', content);
