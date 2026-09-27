const fs = require('fs');
let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

// Add updateCartItemSize to Context type
code = code.replace(
  `updateCartQuantity: (productId: string, quantity: number) => void;`,
  `updateCartQuantity: (productId: string, quantity: number) => void;\n  updateCartItemSize: (productId: string, sizeName: string, quantity: number) => void;`
);

// Add the implementation
const targetImpl = `const updateCartQuantity = (productId: string, quantity: number) => {`;
const newImpl = `const updateCartItemSize = (productId: string, sizeName: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.sizes) {
        let newSizes = [...item.sizes];
        const sizeIndex = newSizes.findIndex(s => s.size === sizeName);
        
        if (sizeIndex >= 0) {
          if (quantity <= 0) {
            newSizes = newSizes.filter(s => s.size !== sizeName);
          } else {
            newSizes[sizeIndex] = { ...newSizes[sizeIndex], quantity };
          }
        } else if (quantity > 0) {
          newSizes.push({ size: sizeName, quantity });
        }
        
        const newTotal = newSizes.reduce((a, b) => a + b.quantity, 0);
        return { ...item, sizes: newSizes, quantity: newTotal };
      }
      return item;
    }).filter(item => item.quantity > 0)); // Auto remove if total quantity drops to 0
  };
  
  const updateCartQuantity = (productId: string, quantity: number) => {`;

code = code.replace(targetImpl, newImpl);

// Export it
code = code.replace(
  `updateCartQuantity,
      removeFromCart,`,
  `updateCartQuantity,
      updateCartItemSize,
      removeFromCart,`
);

fs.writeFileSync('src/lib/DemoContext.tsx', code);
