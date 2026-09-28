const fs = require('fs');
let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

code = code.replace(
  'múltiples productos (ej. "${duplicateLocationsInCsv[0][0]}").', 
  'múltiples productos. (Ej. La ubicación "${duplicateLocationsInCsv[0][0]}" es compartida por: ${duplicateLocationsInCsv[0][1].slice(0, 3).join(", ")}).'
);

code = code.replace(
  'OTRA referencia en el sistema (ej. "${dbConflicts[0].locationCode}").',
  'OTRA referencia en el sistema. (Ej. El producto con SKU "${dbConflicts[0].sku}" en sistema ya usa la ubicación "${dbConflicts[0].locationCode}").'
);

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('Updated messages');
