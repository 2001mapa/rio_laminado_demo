const fs = require('fs');
['src/app/admin/pedidos/[id]/imprimir/page.tsx', 'src/app/admin/pedidos/[id]/verificar/page.tsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import \{([^}]+)\} from 'lucide-react'/g, (m, g1) => m.includes('Loader2') ? m : `import { ${g1}, Loader2 } from 'lucide-react'`);
  fs.writeFileSync(f, c);
});
