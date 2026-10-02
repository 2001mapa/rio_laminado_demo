const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /loadDraft\(data\.user\.id\)\.then\(draft => \{\s*if \(draft && draft\.cart && draft\.cart\.length > 0\) \{\s*setOfflineDraftWaiting\(\{ cart: draft\.cart, clientId: draft\.selectedClientId \}\);\s*\} else \{\s*setIsDraftLoaded\(true\);\s*\}\s*\}\);/;

content = content.replace(regex, 
`loadDraft(data.user.id).then(draft => {
                   if (draft && draft.cart && draft.cart.length > 0) {
                       setOfflineDraftWaiting({ cart: draft.cart, clientId: draft.selectedClientId });
                       if (draft.clientRequestId) {
                           setCurrentCheckoutId(draft.clientRequestId);
                       }
                   } else {
                       setIsDraftLoaded(true);
                   }
               });`);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
