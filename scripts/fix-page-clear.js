const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(
`      } else {
         clearDraft(sellerId);
      }`,
`      } else {
         clearDraft(sellerId).catch(() => {});
      }`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
