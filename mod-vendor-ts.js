const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

code = code.replace(
  /const product = result\.products\.find\(p => p\.sku === sku\);/,
  `const rawProduct = result.products.find(p => p.sku === sku);
      const product = rawProduct ? { ...rawProduct, material: rawProduct.material ?? undefined, imageUrl: rawProduct.imageUrl ?? undefined, hoverImageUrl: rawProduct.hoverImageUrl ?? undefined, locationCode: rawProduct.locationCode ?? undefined } : null;`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
