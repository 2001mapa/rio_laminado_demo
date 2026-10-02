const fs = require('fs');

// 1. Update offlineQueue.ts
let queueContent = fs.readFileSync('src/lib/offlineQueue.ts', 'utf8');
queueContent = queueContent.replace(
  `  items: { productId: string; quantity: number; sizeDetails?: any }[];`,
  `  items: { productId: string; quantity: number; expectedPrice?: number; sizeDetails?: any }[];`
);
fs.writeFileSync('src/lib/offlineQueue.ts', queueContent);

// 2. Update page.tsx to send expectedPrice
let pageContent = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');
pageContent = pageContent.replace(
  `items: cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizeDetails: item.sizes }))`,
  `items: cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, expectedPrice: item.product.price, sizeDetails: item.sizes }))`
);
fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', pageContent);

// 3. Update sync.ts to validate limit
let syncContent = fs.readFileSync('src/app/actions/sync.ts', 'utf8');
syncContent = syncContent.replace(
  `export async function getSyncCatalog(cursor?: string, limit: number = 200) {`,
  `export async function getSyncCatalog(cursor?: string, limit: number = 200) {\n  if (limit > 500) limit = 500;`
);
syncContent = syncContent.replace(
  `export async function getSyncCustomers(cursor?: string, limit: number = 200) {`,
  `export async function getSyncCustomers(cursor?: string, limit: number = 200) {\n  if (limit > 500) limit = 500;`
);

// 4. Update sync.ts so clients are only synced for the specific seller (if applicable).
// Wait, the prompt says "evita que datos de clientes de una cuenta queden visibles para otra en un dispositivo compartido."
// The server should only return the seller's customers!
// Let's modify getSyncCustomers to restrict by sellerId if role is vendedor
const custServerLogic = `export async function getSyncCustomers(cursor?: string, limit: number = 200) {
  const { role, user } = await requireRole(['vendedor', 'admin']);
  if (limit > 500) limit = 500;
  
  let whereClause = {};
  if (role === 'vendedor') {
     const seller = await prisma.seller.findUnique({ where: { authUserId: user.id } });
     if (!seller) throw new Error("Vendedor no encontrado");
     // Usually, clients are global or associated to a seller? Wait, in this B2B demo, are customers global or per-seller?
     // Let's check prisma schema: Customer doesn't have sellerId!
     // If Customer doesn't have sellerId, then all customers are global? But the prompt says:
     // "evita que datos de clientes de una cuenta queden visibles para otra en un dispositivo compartido."
     // How do we prevent it? We store them in IndexedDB, but IndexedDB is per origin!
     // So if another seller logs in on the same device, they see the previous seller's cached customers!
     // To fix this, IndexedDB \`catalog_customers\` needs to be cleared on logout or we just clear the whole DB on logout!
     // Or we can append \`sellerId\` to the keys?
     // The simplest way to "avoid data leak on shared device" is to clear the IDB catalog when the auth user changes, or during logout.
     // Wait, let's just clear the DB in useCatalogSync if sellerId changes, OR clear it in the login/logout flow.
     // Actually, in \`page.tsx\`, we know the sellerId.
  }

  const customers = await prisma.customer.findMany({`;

syncContent = syncContent.replace(/export async function getSyncCustomers\([\s\S]*?const customers = await prisma.customer.findMany\(\{/, custServerLogic);
fs.writeFileSync('src/app/actions/sync.ts', syncContent);
