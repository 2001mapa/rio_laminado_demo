const fs = require('fs');

let mockData = fs.readFileSync('src/lib/mockData.ts', 'utf-8');
// Solo en los objetos de Producto. Los productos tienen "sku:".
mockData = mockData.replace(/username: '[^']+', category:/g, "category:");
fs.writeFileSync('src/lib/mockData.ts', mockData);
