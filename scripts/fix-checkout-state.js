const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /let clientRequestId = currentCheckoutId;\s*if \(!clientRequestId\) \{\s*clientRequestId = uuidv4\(\);\s*setCurrentCheckoutId\(clientRequestId\);\s*const minimalCart = cartItems\.map\(item => \(\{ productId: item\.product\.id, quantity: item\.quantity, sizes: item\.sizes \}\)\);\s*try \{\s*await saveDraft\(\{\s*sellerId,\s*selectedClientId: selectedCustomer\.id,\s*cart: minimalCart,\s*updatedAt: Date\.now\(\),\s*clientRequestId\s*\}\);\s*\} catch \(err\) \{/m;

const replacement = `let clientRequestId = currentCheckoutId;
      if (!clientRequestId) {
          clientRequestId = uuidv4();
          
          const minimalCart = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes }));
          try {
              await saveDraft({
                sellerId,
                selectedClientId: selectedCustomer.id,
                cart: minimalCart,
                updatedAt: Date.now(),
                clientRequestId
              });
              // Solo atar al estado si realmente persistió en IndexedDB
              setCurrentCheckoutId(clientRequestId);
          } catch (err) {`;

if (!regex.test(content)) {
    console.error("Regex did not match!");
} else {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
    console.log("Successfully fixed checkout UUID state assignment.");
}
