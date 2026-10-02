const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(
`      try {
        await addPendingOrder(pendingOrder);
        await clearDraft(sellerId);
        setCartItems([]);
        setStep(1);
        setSelectedCustomer(null);
        setPendingQueue(prev => [...prev, pendingOrder]);
        addToast("Borrador guardado localmente.");`,
`      try {
        await addPendingOrder(pendingOrder);
        
        // Lo añadimos inmediatamente a la cola local en memoria para proteger contra fallos posteriores
        setPendingQueue(prev => [...prev, pendingOrder]);
        
        await clearDraft(sellerId);
        
        setCartItems([]);
        setStep(1);
        setSelectedCustomer(null);
        addToast("Borrador guardado localmente.");`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
