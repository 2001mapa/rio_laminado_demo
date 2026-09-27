const fs = require('fs');

const filesToFix = [
  'src/app/admin/pedidos/[id]/imprimir/page.tsx',
  'src/app/admin/pedidos/[id]/verificar/page.tsx',
  'src/app/admin/pedidos/[id]/page.tsx',
  'src/app/cliente/pedido/[id]/page.tsx'
];

filesToFix.forEach(path => {
  if (fs.existsSync(path)) {
    let code = fs.readFileSync(path, 'utf8');
    
    code = code.replace(/a\.product/g, '(a as any).product');
    code = code.replace(/b\.product/g, '(b as any).product');
    code = code.replace(/item\.product/g, '(item as any).product');
    code = code.replace(/order\.orderNumber/g, 'order.number');

    fs.writeFileSync(path, code);
    console.log('Fixed types in ' + path);
  }
});
