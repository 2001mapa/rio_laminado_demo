const fs = require('fs');
let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

code = code.replace(
  /export type CartItem = \{[\s\S]*?\};/,
  `export type CartItem = {
  product: Product;
  quantity: number;
  sizes?: { size: string; quantity: number }[];
};`
);

code = code.replace(
  /addToCart: \(product: Product, quantity: number\) => void;/,
  `addToCart: (product: Product, quantity: number, sizes?: { size: string; quantity: number }[]) => void;`
);

// We also need to update the actual implementation of addToCart
const addToCartImpl = `
  const addToCart = (product: Product, quantity: number, sizes?: { size: string; quantity: number }[]) => {
    setCart(prev => {
      const stockDisponible = product.physicalStock - product.reservedStock;
      const existing = prev.find(item => item.product.id === product.id);
      
      let newSizes = sizes || [];
      
      if (existing) {
        if (existing.sizes && sizes) {
          // Merge sizes
          const sizeMap = new Map<string, number>();
          existing.sizes.forEach(s => sizeMap.set(s.size, s.quantity));
          sizes.forEach(s => {
            sizeMap.set(s.size, (sizeMap.get(s.size) || 0) + s.quantity);
          });
          newSizes = Array.from(sizeMap.entries()).map(([size, quantity]) => ({ size, quantity }));
        } else if (existing.sizes) {
          newSizes = existing.sizes;
        }

        return prev.map(item => item.product.id === product.id
          ? { ...item, quantity: Math.min(stockDisponible, item.quantity + quantity), sizes: newSizes.length > 0 ? newSizes : undefined }
          : item);
      }
      
      return [...prev, { product, quantity: Math.min(stockDisponible, quantity), sizes: newSizes.length > 0 ? newSizes : undefined }];
    });
  };
`;

code = code.replace(
  /const addToCart = \(product: Product, quantity: number\) => \{[\s\S]*?\}\);\s*\};/,
  addToCartImpl.trim()
);

// Also need to update addOrder signature to accept sizes
code = code.replace(
  /addOrder: \(orderData: \{ customerId\?: string, items: \{ productId: string, quantity: number \}\[\] \}\) => Promise<any>;/,
  `addOrder: (orderData: { customerId?: string, items: { productId: string, quantity: number, sizeDetails?: {size:string,quantity:number}[] }[] }) => Promise<any>;`
);

// update checkoutSeller to pass sizes
code = code.replace(
  /items: cartItems\.map\(\(item\) => \(\{\s*productId: item\.product\.id,\s*quantity: item\.quantity,\s*\}\)\),/,
  `items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          sizeDetails: item.sizes,
        })),`
);

fs.writeFileSync('src/lib/DemoContext.tsx', code);
