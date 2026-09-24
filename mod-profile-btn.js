const fs = require('fs');

let code = fs.readFileSync('src/app/cliente/perfil/page.tsx', 'utf8');

// 1. Remove handleReset
const handleResetRegex = /const handleReset = \(\) => \{[\s\S]*?window\.location\.reload\(\);\s*\}\s*\}/;
code = code.replace(handleResetRegex, '');

// 2. Remove the button from ActionButtons
const buttonRegex = /<button[\s\S]*?onClick=\{handleReset\}[\s\S]*?<\/button>/;
code = code.replace(buttonRegex, '');

// 3. Remove resetDemoData import if it exists, though usually it's from DemoContext
const resetDemoRegex = /resetDemoData(, )?/;
code = code.replace(resetDemoRegex, '');

// Also remove RefreshCw import if it's no longer used
// It might be imported from lucide-react
const refreshCwRegex = /RefreshCw, /;
code = code.replace(refreshCwRegex, '');

fs.writeFileSync('src/app/cliente/perfil/page.tsx', code);
console.log('Button removed');
