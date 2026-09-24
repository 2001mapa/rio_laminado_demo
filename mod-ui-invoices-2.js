const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

// I will just use string manipulation to remove handleSaveInvoice
const startSearch = 'const handleSaveInvoice = async (groupId: string) => {';
const startIndex = code.indexOf(startSearch);
if (startIndex !== -1) {
  // find the closing brace. It has a try/catch/finally.
  const afterStart = code.substring(startIndex);
  // Just find the end of the function by counting braces or finding `  };` which usually closes it
  const endIndex = startIndex + afterStart.indexOf('  };\n');
  if (endIndex !== startIndex - 1) {
    code = code.substring(0, startIndex) + code.substring(endIndex + 5);
    fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', code);
    console.log('Removed handleSaveInvoice block completely');
  } else {
    console.log('Could not find end of handleSaveInvoice');
  }
} else {
  console.log('handleSaveInvoice not found');
}
