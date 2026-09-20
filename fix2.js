const fs = require('fs');
let c = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');
c = c.replace(/const price = parseFloat\(item\.price\?\.toString\(\)\.replace/g, "const priceStr = item.price ? item.price.toString() : '0';\n      const price = parseFloat(priceStr.replace");
fs.writeFileSync('src/app/actions/inventory.ts', c);
