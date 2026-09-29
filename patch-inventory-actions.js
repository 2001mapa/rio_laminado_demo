const fs = require('fs');

let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

code = code.replace(
  "return { success: true, message: 'Producto actualizado exitosamente.' };",
  "return { success: true, product: after, message: 'Producto actualizado exitosamente.' };"
);

// We need to capture `created` in `createSingleProduct`
const targetCreate = `await prisma.product.create({
      data: {
        sku: data.sku.toUpperCase(),`;

const replaceCreate = `const created = await prisma.product.create({
      data: {
        sku: data.sku.toUpperCase(),`;

if (code.includes(targetCreate)) {
    code = code.replace(targetCreate, replaceCreate);
    code = code.replace(
      "return { success: true, message: 'Producto creado exitosamente.' };",
      "return { success: true, product: created, message: 'Producto creado exitosamente.' };"
    );
}

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('Fixed inventory actions');
