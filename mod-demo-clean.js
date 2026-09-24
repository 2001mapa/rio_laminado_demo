const fs = require('fs');

let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

// Remove addCustomer from interface
code = code.replace(/\s*addCustomer: \(customer: Customer\) => void;/g, '');

// Remove addCustomer implementation
const addRegex = /const addCustomer = async \(customer: Customer\) => \{[\s\S]*?\}\s*\} catch \(e\) \{ console\.error\(e\) \}\s*\};/;
code = code.replace(addRegex, '');

// Remove addCustomer from export
code = code.replace(/\s*addCustomer,/g, '');

fs.writeFileSync('src/lib/DemoContext.tsx', code);
console.log('addCustomer removed from DemoContext');
