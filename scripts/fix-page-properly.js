const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. En loadDraft, restaurar el clientRequestId
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
                     if (draft.clientRequestId) {
                         setCurrentCheckoutId(draft.clientRequestId);
                     }
                 } else {
                     setIsDraftLoaded(true);
                 }
             });`
);

// 2. Modificar el autoguardado para guardar clientRequestId y no dejar promesas sin manejar
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
           addToast('Error local: tu borrador no pudo ser protegido en el almacenamiento.');
         });
      } else {
         clearDraft(sellerId).catch(() => {});
      }
    }, [cartItems, selectedCustomer, sellerId, isDraftLoaded, offlineDraftWaiting, currentCheckoutId]);`;

content = content.replace(oldEffect, newEffect);

// 3. Modificar handleCheckout para persistir clientRequestId en BD ANTES de addPendingOrder
// Y consultar IDB si currentCheckoutId ya existe para bloquear UUID nuevo tras recarga
const oldCheckoutHead = 
`  const handleCheckout = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    
    // Si ya existe en la cola, bloquemos la creación de uno nuevo
    if (currentCheckoutId && pendingQueue.some(o => o.clientRequestId === currentCheckoutId)) {
        addToast("Este pedido ya está en la cola de envíos.");
        return;
    }`;

const newCheckoutHead = 
`  const handleCheckout = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    
    if (currentCheckoutId) {
        // Consultar IDB directo para estado parcial recargado
        const idbQueue = await getPendingOrders(sellerId);
        if (idbQueue.some(o => o.clientRequestId === currentCheckoutId)) {
            addToast("Este pedido ya está en la cola de envíos.");
            setCartItems([]);
            await clearDraft(sellerId).catch(()=>{});
            return;
        }
    }`;

content = content.replace(oldCheckoutHead, newCheckoutHead);

// 4. persistir el UUID inmediatamente tras crearlo para que clearDraft sepa cuál fue
const oldUuid = 
`    let clientRequestId = currentCheckoutId;
    if (!clientRequestId) {
        clientRequestId = uuidv4();
        setCurrentCheckoutId(clientRequestId);
    }`;

const newUuid = 
`    let clientRequestId = currentCheckoutId;
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
    }`;

content = content.replace(oldUuid, newUuid);

// 5. Corregir el try block para que setPendingQueue se haga antes de clearDraft!
const oldTryBlock = 
`    try {
      await addPendingOrder(pendingOrder);
      await clearDraft(sellerId);
      setCartItems([]);
      setStep(1);
      setSelectedCustomer(null);
      setPendingQueue(prev => [...prev, pendingOrder]);
      addToast("Borrador guardado localmente.");`;

const newTryBlock = 
`    try {
      await addPendingOrder(pendingOrder);
      
      // Lo añadimos inmediatamente a la cola local en memoria para proteger contra fallos posteriores
      setPendingQueue(prev => [...prev, pendingOrder]);
      
      await clearDraft(sellerId).catch(() => {});
      
      setCartItems([]);
      setStep(1);
      setSelectedCustomer(null);
      addToast("Borrador guardado localmente.");`;

content = content.replace(oldTryBlock, newTryBlock);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
