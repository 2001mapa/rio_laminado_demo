const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(
`         saveDraft({ sellerId, selectedClientId: selectedCustomer?.id, cart: minimalCart, updatedAt: Date.now() });
      } else {
         clearDraft(sellerId);
      }`,
`         saveDraft({ 
           sellerId, 
           selectedClientId: selectedCustomer?.id, 
           cart: minimalCart, 
           updatedAt: Date.now(),
           clientRequestId: currentCheckoutId || undefined 
         }).catch(err => {
           addToast('Error local: tu borrador no pudo ser protegido en el almacenamiento.');
         });
      } else {
         clearDraft(sellerId).catch(() => {});
      }`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
