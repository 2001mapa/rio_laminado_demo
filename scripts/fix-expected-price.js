const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(
  /items:\s*cartItems\.map\(item\s*=>\s*\(\{\s*productId:\s*item\.product\.id,\s*quantity:\s*item\.quantity,\s*sizeDetails:\s*item\.sizes,?\s*\}\)\),/m,
  `items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          expectedPrice: item.product.price,
          sizeDetails: item.sizes,
        })),`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
