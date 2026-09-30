const fs = require('fs');
const files = [
  'src/app/admin/pedidos/[id]/page.tsx',
  'src/app/admin/pedidos/[id]/imprimir/page.tsx',
  'src/app/admin/pedidos/[id]/verificar/page.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<div className="p-4 text-rio-muted">Cargando pedido\.\.\.<\/div>/g, '<div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-rio-muted print:hidden"><Loader2 className="w-10 h-10 animate-spin" /><p className="font-bold uppercase tracking-widest text-sm">Cargando pedido...</p></div>');
  
  // Make sure Loader2 is imported if it isn't!
  if (!c.includes('Loader2') && c.includes('lucide-react')) {
     c = c.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Loader2 } from 'lucide-react';");
  }
  
  fs.writeFileSync(f, c);
});
console.log("Updated loading UI");
