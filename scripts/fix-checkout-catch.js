const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /let clientRequestId = currentCheckoutId;\s*if \(!clientRequestId\) \{\s*clientRequestId = uuidv4\(\);\s*setCurrentCheckoutId\(clientRequestId\);\s*\/\/ Asegurar que el borrador queda con el ID correcto en BD antes de crear el pedido\s*const minimalCart = cartItems\.map\(item => \(\{ productId: item\.product\.id, quantity: item\.quantity, sizes: item\.sizes \}\)\);\s*await saveDraft\(\{\s*sellerId,\s*selectedClientId: selectedCustomer\.id,\s*cart: minimalCart,\s*updatedAt: Date\.now\(\),\s*clientRequestId\s*\}\)\.catch\(\(\) => \{\}\);\s*\}/;

const replacement = 
`let clientRequestId = currentCheckoutId;
      if (!clientRequestId) {
          clientRequestId = uuidv4();
          setCurrentCheckoutId(clientRequestId);
          
          const minimalCart = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes }));
          try {
              await saveDraft({
                sellerId,
                selectedClientId: selectedCustomer.id,
                cart: minimalCart,
                updatedAt: Date.now(),
                clientRequestId
              });
          } catch (err) {
              console.error(err);
              addToast("Error al bloquear el borrador. Revisa tu almacenamiento local.");
              setIsCheckingOut(false);
              return;
          }
      }`;

if (!regex.test(content)) {
    console.error("Regex did not match!");
} else {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
    console.log("Successfully replaced UUID save lock block.");
}
