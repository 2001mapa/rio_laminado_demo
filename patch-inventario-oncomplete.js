const fs = require('fs');

let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

// Modify onComplete to accept a product, but wait, `refreshData` might be fine if we just update `catalogProducts` manually.
// Let's replace the `onComplete` for the CreateProductModal.
const targetOnComplete = `onComplete={() => {
            setShowMockModal(false);
            setEditingProduct(null);
            refreshData();
            fetchProducts(true);
            fetchCounts();
          }}`;

const replaceOnComplete = `onComplete={(updatedProduct?: any) => {
            setShowMockModal(false);
            setEditingProduct(null);
            refreshData();
            if (updatedProduct) {
              setCatalogProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
            } else {
              // Only refetch entirely if it's a new product or we don't have the updated one
              fetchProducts(true);
            }
            fetchCounts();
          }}`;

code = code.replace(targetOnComplete, replaceOnComplete);
fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('Fixed onComplete in inventario/page');
