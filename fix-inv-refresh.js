const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

code = code.replace(
  /onComplete=\{\(\) => \{\n\s*setShowMockModal\(false\);\n\s*setEditingProduct\(null\);\n\s*refreshData\(\);\n\s*\}\}/g,
  `onComplete={() => {
            setShowMockModal(false);
            setEditingProduct(null);
            refreshData();
            fetchProducts(true);
          }}`
);

fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('Fixed onComplete in InventarioPage');
