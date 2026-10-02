const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const effectToRemove = 
`  useEffect(() => {
    // Si cambia el carrito, invalidamos el checkout id actual para permitir un nuevo pedido
    if (cartItems.length > 0) {
       setCurrentCheckoutId(null);
    }
  }, [cartItems]);`;

content = content.replace(effectToRemove, '');

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
