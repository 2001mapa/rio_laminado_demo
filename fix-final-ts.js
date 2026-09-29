const fs = require('fs');

// 1. sellers.ts imports
let sellers = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');
if (!sellers.includes('getAuditActor')) {
   sellers = "import { logAuditEvent, getAuditActor } from '@/lib/audit';\n" + sellers;
} else if (!sellers.includes('import { logAuditEvent')) {
   sellers = "import { logAuditEvent, getAuditActor } from '@/lib/audit';\n" + sellers;
}
fs.writeFileSync('src/app/actions/sellers.ts', sellers);

// 2. CreateProductModal.tsx
let modal = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');
modal = modal.replace("updateRes.product || updateRes.data", "updateRes.product");
modal = modal.replace("createRes.product || createRes.data", "createRes.product");
modal = modal.replace("let finalProduct: any = null;", "");
// declare finalProduct outside the try block
modal = modal.replace("const handleSubmit = async (e: React.FormEvent) => {", "const handleSubmit = async (e: React.FormEvent) => {\nlet finalProduct: any = null;");
fs.writeFileSync('src/components/CreateProductModal.tsx', modal);

// 3. SellerModal.tsx
let sellerModal = fs.readFileSync('src/components/SellerModal.tsx', 'utf8');
sellerModal = sellerModal.replace("setTempPassword(res.tempPassword);", "setTempPassword(res.tempPassword || '');");
fs.writeFileSync('src/components/SellerModal.tsx', sellerModal);

console.log('Fixed final TS errors');
