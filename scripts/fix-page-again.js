const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Modificar DraftLoaded para setear currentCheckoutId
content = content.replace(
`             loadDraft(data.user.id).then(draft => {
                 if (draft && draft.cart && draft.cart.length > 0) {
                     setOfflineDraftWaiting({ cart: draft.cart, clientId: draft.selectedClientId });
                 } else {
                     setIsDraftLoaded(true);
                 }
             });`,
`             loadDraft(data.user.id).then(draft => {
                 if (draft && draft.cart && draft.cart.length > 0) {
                     setOfflineDraftWaiting({ cart: draft.cart, clientId: draft.selectedClientId });
                     if (draft.clientRequestId) setCurrentCheckoutId(draft.clientRequestId);
                 } else {
                     setIsDraftLoaded(true);
                 }
             });`
);

// 2. Modificar el autoguardado para capturar el error y guardar clientRequestId
const oldEffect = 
`    useEffect(() => {
      if (!isDraftLoaded || offlineDraftWaiting) return;
      if (!sellerId) return;
      
      if (cartItems.length > 0 || selectedCustomer) {
         const minimalCart = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes }));
         saveDraft({ sellerId, selectedClientId: selectedCustomer?.id, cart: minimalCart, updatedAt: Date.now() });
      } else {
         clearDraft(sellerId);
      }
    }, [cartItems, selectedCustomer, sellerId, isDraftLoaded, offlineDraftWaiting]);`;

const newEffect = 
`    useEffect(() => {
      if (!isDraftLoaded || offlineDraftWaiting) return;
      if (!sellerId) return;
      
      if (cartItems.length > 0 || selectedCustomer) {
         const minimalCart = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes }));
         saveDraft({ 
           sellerId, 
           selectedClientId: selectedCustomer?.id, 
           cart: minimalCart, 
           updatedAt: Date.now(),
           clientRequestId: currentCheckoutId || undefined
         }).catch(err => {
           console.error('Error al autoguardar borrador:', err);
           addToast('Error local: tu borrador no pudo ser protegido en el almacenamiento.');
         });
      } else {
         clearDraft(sellerId).catch(() => {});
      }
    }, [cartItems, selectedCustomer, sellerId, isDraftLoaded, offlineDraftWaiting, currentCheckoutId]);`;

content = content.replace(oldEffect, newEffect);


// 3. Modificar handleCheckout para persistir clientRequestId en BD ANTES de addPendingOrder si no lo estaba
const oldCheckout = 
`      let clientRequestId = currentCheckoutId;
      if (!clientRequestId) {
          clientRequestId = uuidv4();
          setCurrentCheckoutId(clientRequestId);
      }
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      const pendingOrder: PendingOrder = {`;

const newCheckout = 
`      let clientRequestId = currentCheckoutId;
      if (!clientRequestId) {
          clientRequestId = uuidv4();
          setCurrentCheckoutId(clientRequestId);
          
          // Asegurar que el borrador queda con el ID correcto en BD antes de crear el pedido
          // así si clearDraft falla o se recarga la PWA, el UUID es el mismo.
          const minimalCart = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes }));
          await saveDraft({
            sellerId,
            selectedClientId: selectedCustomer.id,
            cart: minimalCart,
            updatedAt: Date.now(),
            clientRequestId
          }).catch(() => {}); // Ignoramos fallos de cuota aquí, saltará en addPendingOrder
      }
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      const pendingOrder: PendingOrder = {`;

content = content.replace(oldCheckout, newCheckout);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
