const fs = require('fs');
let text = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

const regex = /const checkoutSeller = async \(customerId: string, cartItems: CartItem\[\]\) => \{[\s\S]*?return result;\s*\};/;

const newCode = `const checkoutSeller = async (customerId: string, cartItems: CartItem[]) => {
    if (!currentSeller) return { success: false, error: 'No seller logged in' };
    
    const orderData = {
      customerId,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };
    
    const result = await addOrder(orderData);
    if (result && result.success) {
      await refreshData();
      setCart([]);
    }
    return result;
  };`;

text = text.replace(regex, newCode);
fs.writeFileSync('src/lib/DemoContext.tsx', text);
console.log("Regex replace done");
