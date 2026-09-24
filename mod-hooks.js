const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const injectHooks = `
  const selectedProductIndex = selectedProduct ? filteredProducts.findIndex(p => p.id === selectedProduct.id) : -1;
  const handlePrevProduct = () => { if (selectedProductIndex > 0) setSelectedProduct(filteredProducts[selectedProductIndex - 1]); };
  const handleNextProduct = () => { if (selectedProductIndex < filteredProducts.length - 1) setSelectedProduct(filteredProducts[selectedProductIndex + 1]); };
`;

code = code.replace('const ProductCard = ({ product, onExpand }:', injectHooks + '\n  const ProductCard = ({ product, onExpand }:');
fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Hooks injected');
