const fs = require('fs');
let pageCode = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

// Also refresh counts when a product is edited.
// In InventarioPage, fetchProducts is called inside onComplete and when filters change.
// To avoid fetching counts on every filter change (since counts are global), 
// we should only fetch counts on load and onComplete.
// Let's add it to onComplete inside CreateProductModal, CSVImporter, BulkPhotoUploader.

pageCode = pageCode.replace(
  /onComplete=\{\(\) => refreshData\(\)\}/g,
  `onComplete={() => { refreshData(); fetchCounts(); }}`
);

pageCode = pageCode.replace(
  /fetchProducts\(true\);\s*\}\}/g,
  `fetchProducts(true);\n            fetchCounts();\n          }}`
);

fs.writeFileSync('src/app/admin/inventario/page.tsx', pageCode);
console.log('Added fetchCounts to onComplete handlers');
