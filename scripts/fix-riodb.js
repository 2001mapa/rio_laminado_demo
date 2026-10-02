const fs = require('fs');
let content = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');

const rioDBFix = `export interface RioDB extends DBSchema {
  drafts: { key: string; value: DraftOrder; };
  pending_orders: { key: string; value: PendingOrder; indexes: { 'by-seller': string }; };
  catalog_products: { key: string; value: CatalogProduct; indexes: { 'by-sku': string }; };
  catalog_customers: { key: string; value: CatalogCustomer; };
  sync_meta: { key: string; value: SyncMeta; };
}`;

content = content.replace(
/interface RioDB extends DBSchema \{[\s\S]*?indexes: \{ 'by-seller': string \};\s*\};\s*\}/,
rioDBFix
);

fs.writeFileSync('src/lib/offlineQueue.ts', content);
