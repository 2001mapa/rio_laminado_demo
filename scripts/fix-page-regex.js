const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /saveDraft\(\{ sellerId, selectedClientId: selectedCustomer\?\.id, cart: minimalCart, updatedAt: Date\.now\(\) \}\);/g;

content = content.replace(regex, 
`saveDraft({ 
           sellerId, 
           selectedClientId: selectedCustomer?.id, 
           cart: minimalCart, 
           updatedAt: Date.now(),
           clientRequestId: currentCheckoutId || undefined 
         }).catch(err => {
           addToast('Error local: tu borrador no pudo ser protegido en el almacenamiento.');
         });`);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
