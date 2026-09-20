const fs = require('fs');

// 1. auth-helpers.ts
let auth = fs.readFileSync('src/utils/auth-helpers.ts', 'utf8');
auth = auth.replace(/export async function getSessionUser\(token\?: string\): Promise<\{ user: User \| null; role: Role \| null \}> \{[\s\S]*?const supabase = await createClient\(\);\s*const \{ data: \{ user \}, error \} = token\s*\?\s*await supabase\.auth\.getUser\(token\)\s*:\s*await supabase\.auth\.getUser\(\);/m, 
`export async function getSessionUser(): Promise<{ user: User | null; role: Role | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();`);
auth = auth.replace(/const role = \(user\.user_metadata\?\.role as Role\) \|\| 'admin'; \/\/ Fallback to admin if not specified/g, 
`const role = (user.user_metadata?.role as Role) || null; // No fallback`);
auth = auth.replace(/export async function requireRole\(allowedRoles: Role\[\], token\?: string\): Promise<User> \{[\s\S]*?const \{ user, role \} = await getSessionUser\(token\);/m, 
`export async function requireRole(allowedRoles: Role[]): Promise<User> {
  const { user, role } = await getSessionUser();`);
fs.writeFileSync('src/utils/auth-helpers.ts', auth);

// 2. inventory.ts
let inv = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');
inv = inv.replace(/export async function bulkUploadInventory\(items: any\[\], token\?: string\) \{/g, 'export async function bulkUploadInventory(items: any[]) {');
inv = inv.replace(/export async function previewCSVUpload\(items: any\[\], token\?: string\) \{/g, 'export async function previewCSVUpload(items: any[]) {');
inv = inv.replace(/await requireRole\(\['admin'\], token\);/g, "await requireRole(['admin']);");
inv = inv.replace(/\}, token\?: string\) \{/g, '}) {');
fs.writeFileSync('src/app/actions/inventory.ts', inv);

// 3. CSVImporter.tsx
let csv = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');
csv = csv.replace(/const \{ createClient \} = await import\('@\/utils\/supabase\/client'\);\s*const supabase = createClient\(\);\s*const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s*const previewResponse = await previewCSVUpload\(mappedItems, session\?\.access_token\);/gm, 
'const previewResponse = await previewCSVUpload(mappedItems);');
csv = csv.replace(/const \{ createClient \} = await import\('@\/utils\/supabase\/client'\);\s*const supabase = createClient\(\);\s*const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s*const response = await bulkUploadInventory\(parsedItems, session\?\.access_token\);/gm, 
'const response = await bulkUploadInventory(parsedItems);');
fs.writeFileSync('src/components/CSVImporter.tsx', csv);

// 4. CreateProductModal.tsx
let prod = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');
prod = prod.replace(/const \{ createClient \} = await import\('@\/utils\/supabase\/client'\);\s*const supabase = createClient\(\);\s*const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s*const createRes = await createSingleProduct\(productData, session\?\.access_token\);/gm, 
'const createRes = await createSingleProduct(productData);');
fs.writeFileSync('src/components/CreateProductModal.tsx', prod);

// 5. middleware.ts (updateSession)
let mw = fs.readFileSync('src/utils/supabase/middleware.ts', 'utf8');
mw = mw.replace(/const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\)\s*const user = session\?\.user/m, 
`const { data: { user } } = await supabase.auth.getUser()`);
fs.writeFileSync('src/utils/supabase/middleware.ts', mw);
