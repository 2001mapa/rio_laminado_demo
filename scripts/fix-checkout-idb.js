const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /if \(currentCheckoutId && pendingQueue\.some\(o => o\.clientRequestId === currentCheckoutId\)\) \{\s*addToast\("Este pedido ya estǭ en la cola de envos\."\);\s*return;\s*\}/;
// also handle the weird encoding just in case
const backupRegex = /if \(currentCheckoutId && pendingQueue\.some\(o => o\.clientRequestId === currentCheckoutId\)\) \{\s*addToast\("Este pedido ya est.*? en la cola de env.*?os\."\);\s*return;\s*\}/;

const replacement = 
`if (currentCheckoutId) {
          const idbQueue = await getPendingOrders(sellerId);
          if (idbQueue.some(o => o.clientRequestId === currentCheckoutId)) {
              addToast("Este pedido ya está en la cola de envíos.");
              
              // Opcionalmente limpiar el carrito porque ya lo capturó el IDB
              setCartItems([]);
              setStep(1);
              setSelectedCustomer(null);
              return;
          }
      }`;

if (backupRegex.test(content)) {
    content = content.replace(backupRegex, replacement);
    fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
    console.log("Successfully replaced getPendingOrders check.");
} else {
    console.error("Regex did not match for pendingQueue check!");
}
