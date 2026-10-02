const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// FIX 1: move setPendingQueue BEFORE clearDraft
const oldTryBlock = 
`      try {
        await addPendingOrder(pendingOrder);
        await clearDraft(sellerId);
        setCartItems([]);
        setStep(1);
        setSelectedCustomer(null);
        setPendingQueue(prev => [...prev, pendingOrder]);
        addToast("Borrador guardado localmente.");`;

const newTryBlock = 
`      try {
        await addPendingOrder(pendingOrder);
        
        // Lo añadimos inmediatamente a la cola local en memoria para proteger contra fallos posteriores
        setPendingQueue(prev => [...prev, pendingOrder]);
        
        await clearDraft(sellerId).catch(() => {}); // Ignore clear errors here
        
        setCartItems([]);
        setStep(1);
        setSelectedCustomer(null);
        addToast("Borrador guardado localmente.");`;

if (content.includes(oldTryBlock)) {
    content = content.replace(oldTryBlock, newTryBlock);
} else {
    // try regex
    content = content.replace(/await addPendingOrder\(pendingOrder\);\s+await clearDraft\(sellerId\);\s+setCartItems\(\[\]\);\s+setStep\(1\);\s+setSelectedCustomer\(null\);\s+setPendingQueue\(prev => \[\.\.\.prev, pendingOrder\]\);\s+addToast\("Borrador guardado localmente\."\);/, newTryBlock);
}

// FIX 2: Check IDB directly to be safe, in case page reloads
const oldCheckoutTop = 
`    // Si ya existe en la cola, bloquemos la creación de uno nuevo
    if (currentCheckoutId && pendingQueue.some(o => o.clientRequestId === currentCheckoutId)) {
        addToast("Este pedido ya está en la cola de envíos.");
        return;
    }`;

const newCheckoutTop = 
`    // Si ya existe en la cola, bloquemos la creación de uno nuevo
    if (currentCheckoutId) {
        // Consultar IDB directo para estado parcial recargado
        const idbQueue = await getPendingOrders(sellerId);
        if (idbQueue.some(o => o.clientRequestId === currentCheckoutId)) {
            addToast("Este pedido ya está en la cola de envíos.");
            setCartItems([]); // Limpiamos el carrito bloqueado
            await clearDraft(sellerId).catch(()=>{});
            return;
        }
    }`;

content = content.replace(oldCheckoutTop, newCheckoutTop);


fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
