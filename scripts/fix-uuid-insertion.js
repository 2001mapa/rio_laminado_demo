const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /let clientRequestId = currentCheckoutId;\s+if \(!clientRequestId\) \{\s+clientRequestId = uuidv4\(\);\s+setCurrentCheckoutId\(clientRequestId\);\s+\}/;

content = content.replace(regex, 
`let clientRequestId = currentCheckoutId;
      if (!clientRequestId) {
          clientRequestId = uuidv4();
          setCurrentCheckoutId(clientRequestId);
          
          // Asegurar que el borrador queda con el ID correcto en BD antes de crear el pedido
          const minimalCart = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes }));
          await saveDraft({
            sellerId,
            selectedClientId: selectedCustomer.id,
            cart: minimalCart,
            updatedAt: Date.now(),
            clientRequestId
          }).catch(() => {}); 
      }`);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
