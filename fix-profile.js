const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/perfil/page.tsx', 'utf8');

const regex1 = /const \[debugSession, setDebugSession\] = useState<any>\(null\);[\s\S]*?\}, \[currentCustomer\]\);/;
code = code.replace(regex1, '');

const regex2 = /const debugInfo = \{[\s\S]*?\};\n\s*return \(/;
code = code.replace(regex2, `return (`);

fs.writeFileSync('src/app/cliente/perfil/page.tsx', code);
console.log('Removed diagnostic info from profile');
