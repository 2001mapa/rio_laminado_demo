const fs = require('fs');

let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

// 1. Remove mockData import
code = code.replace(/import \{ initialProducts, initialCustomers, initialOrders, initialSellers \} from '\.\/mockData';\s*/g, '');

// 2. Remove resetDemoData from interface
code = code.replace(/\s*resetDemoData: \(\) => void;/g, '');

// 3. Remove resetDemoData implementation
const implRegex = /const resetDemoData = \(\) => \{[\s\S]*?setSellers\(initialSellers\);\s*\};/;
code = code.replace(implRegex, '');

// 4. Remove from exported value
code = code.replace(/\s*resetDemoData,/g, '');

fs.writeFileSync('src/lib/DemoContext.tsx', code);
console.log('DemoContext updated successfully to remove mocks.');
