const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/perfil/page.tsx', 'utf8');

const regexToRemove = /<pre className="text-\[10px\] text-left bg-gray-100 p-4 rounded overflow-auto max-w-full text-black">[\s\S]*?<\/pre>/;
code = code.replace(regexToRemove, '');

fs.writeFileSync('src/app/cliente/perfil/page.tsx', code);
console.log('Removed debug pre tag');
