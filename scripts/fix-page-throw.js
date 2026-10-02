const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(
`      await clearDraft(sellerId).catch(() => {});
      
      setCartItems([]);
      setStep(1);
      setSelectedCustomer(null);
      addToast("Borrador guardado localmente.");`,
`      await clearDraft(sellerId);
      
      setCartItems([]);
      setStep(1);
      setSelectedCustomer(null);
      addToast("Borrador guardado localmente.");`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
