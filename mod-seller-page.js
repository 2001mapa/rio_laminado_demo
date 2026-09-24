const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/page.tsx', 'utf8');

if (!code.includes('addToast')) {
   code = code.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { addToast } from '@/lib/toast';");
}

code = code.replace(
  /<Link href="#" className="text-xs font-bold text-rio-gold-dark hover:underline">\s*Ver todos\s*<\/Link>/g,
  '<button onClick={() => addToast(\'La vista de todos los pedidos está en construcción.\')} className="text-xs font-bold text-rio-gold-dark hover:underline">Ver todos</button>'
);

fs.writeFileSync('src/app/vendedor/page.tsx', code);
console.log('Seller page updated');
