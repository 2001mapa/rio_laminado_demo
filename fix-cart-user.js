const fs = require('fs');
let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

// Change localStorage saving for cart
const oldSaveEffect = `    localStorage.setItem('rio_sellers', JSON.stringify(sellers));
    localStorage.setItem('rio_current_customer', JSON.stringify(currentCustomer));
    localStorage.setItem('rio_current_seller', JSON.stringify(currentSeller));
    localStorage.setItem('rio_cart', JSON.stringify(cart));
  }, [products, customers, orders, sellers, currentCustomer, currentSeller, cart, isLoaded]);`;

const newSaveEffect = `    localStorage.setItem('rio_sellers', JSON.stringify(sellers));
    localStorage.setItem('rio_current_customer', JSON.stringify(currentCustomer));
    localStorage.setItem('rio_current_seller', JSON.stringify(currentSeller));
    
    // Asocia el carrito al usuario activo
    if (currentUserAuthId) {
      localStorage.setItem(\`rio_cart_\${currentUserAuthId}\`, JSON.stringify(cart));
    } else {
      localStorage.removeItem('rio_cart'); // Para no mezclar
    }
  }, [products, customers, orders, sellers, currentCustomer, currentSeller, cart, isLoaded, currentUserAuthId]);`;

code = code.replace(oldSaveEffect, newSaveEffect);

// Change localStorage loading
const oldLoadProcess = `    async function processSession(session: any) {
      if (session?.user) {
        setCurrentUserAuthId(session.user.id);`;

const newLoadProcess = `    async function processSession(session: any) {
      if (session?.user) {
        setCurrentUserAuthId(session.user.id);
        const storedCart = localStorage.getItem(\`rio_cart_\${session.user.id}\`);
        if (storedCart && storedCart !== "undefined") {
          try { setCart(JSON.parse(storedCart)); } catch(e){}
        } else {
          setCart([]);
        }`;

code = code.replace(oldLoadProcess, newLoadProcess);

// Remove the global cart load logic since processSession handles it
const globalLoadOld = `    try {
      const storedCart = localStorage.getItem('rio_cart');
      if (storedCart && storedCart !== "undefined") setCart(JSON.parse(storedCart));
    } catch (e) {
      console.error("Failed to parse cart", e);
    }`;

code = code.replace(globalLoadOld, `// Cart loading is now handled inside processSession per user`);

fs.writeFileSync('src/lib/DemoContext.tsx', code);
console.log('Fixed cart per user account');
