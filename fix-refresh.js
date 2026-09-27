const fs = require('fs');

let pageCode = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

// Replace the CSVImporter and BulkPhotoUploader onComplete to include fetchProducts(true)
pageCode = pageCode.replace(
  /<CSVImporter onComplete=\{\(\) => \{ refreshData\(\); fetchCounts\(\); \}\} \/>/g,
  '<CSVImporter onComplete={() => { refreshData(); fetchProducts(true); fetchCounts(); }} />'
);

pageCode = pageCode.replace(
  /<BulkPhotoUploader onComplete=\{\(\) => \{ refreshData\(\); fetchCounts\(\); \}\} \/>/g,
  '<BulkPhotoUploader onComplete={() => { refreshData(); fetchProducts(true); fetchCounts(); }} />'
);

fs.writeFileSync('src/app/admin/inventario/page.tsx', pageCode);
console.log('Fixed onComplete to include fetchProducts(true)');
