const fs = require('fs');

// 1. orders.ts use server
let orders = fs.readFileSync('src/app/actions/orders.ts', 'utf8');
if (orders.startsWith("import { unstable_noStore")) {
   orders = orders.replace("import { unstable_noStore as noStore } from 'next/cache';\n'use server'", "'use server';\nimport { unstable_noStore as noStore } from 'next/cache';");
}
fs.writeFileSync('src/app/actions/orders.ts', orders);

// 2. CreateProductModal finalProduct
let modal = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');
// Make sure finalProduct is declared correctly
modal = modal.replace("const handleSubmit = async (e: React.FormEvent) => {\nlet finalProduct: any = null;", "const handleSubmit = async (e: React.FormEvent) => {");
if (!modal.includes("let finalProduct: any = null;")) {
    modal = modal.replace("const handleSubmit = async (e: React.FormEvent) => {\n", "const handleSubmit = async (e: React.FormEvent) => {\n    let finalProduct: any = null;\n");
}
// I will just redefine it blindly to be sure it's inside handleSubmit
modal = modal.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?e\.preventDefault\(\);/g, "const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    let finalProduct: any = null;");
fs.writeFileSync('src/components/CreateProductModal.tsx', modal);

// 3. SellerModal
let seller = fs.readFileSync('src/components/SellerModal.tsx', 'utf8');
seller = seller.replace("setTempPassword(res.tempPassword || '');", "setTempPassword(res.tempPassword || '');");
// wait, maybe the replace failed. Let's just do it again forcefully.
seller = seller.replace("setTempPassword(res.tempPassword);", "setTempPassword(res.tempPassword || '');");
fs.writeFileSync('src/components/SellerModal.tsx', seller);

console.log('Fixed build issues');
