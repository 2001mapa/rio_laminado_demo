const fs = require('fs');
let c = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');
c = c.replace(/export async function bulkUploadInventory\(items: any\[\]\) \{/g, 'export async function bulkUploadInventory(items: any[], token?: string) {');
c = c.replace(/export async function previewCSVUpload\(items: any\[\]\) \{/g, 'export async function previewCSVUpload(items: any[], token?: string) {');
c = c.replace(/await requireRole\(\['admin'\]\);/g, "await requireRole(['admin'], token);");
fs.writeFileSync('src/app/actions/inventory.ts', c);
