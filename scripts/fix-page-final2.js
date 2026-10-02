const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(/await addPendingOrder\(pendingOrder\);\s+await clearDraft\(sellerId\);\s+setCartItems\(\[\]\);\s+setStep\(1\);\s+setSelectedCustomer\(null\);\s+setPendingQueue\(prev => \[\.\.\.prev, pendingOrder\]\);\s+addToast\("Borrador guardado localmente\."\);/, 
`await addPendingOrder(pendingOrder);
      
      // Lo añadimos inmediatamente a la cola local en memoria para proteger contra fallos posteriores
      setPendingQueue(prev => [...prev, pendingOrder]);
      
      await clearDraft(sellerId).catch(() => {});
      
      setCartItems([]);
      setStep(1);
      setSelectedCustomer(null);
      addToast("Borrador guardado localmente.");`);

content = content.replace(/ clearDraft\(sellerId\);/, ' clearDraft(sellerId).catch(() => {});');

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
