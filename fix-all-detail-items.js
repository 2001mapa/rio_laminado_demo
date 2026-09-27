const fs = require('fs');

const filesToFix = [
  'src/app/admin/pedidos/[id]/imprimir/page.tsx',
  'src/app/admin/pedidos/[id]/verificar/page.tsx',
  'src/app/cliente/pedido/[id]/page.tsx'
];

filesToFix.forEach(path => {
  if (fs.existsSync(path)) {
    let code = fs.readFileSync(path, 'utf8');
    
    // Fix the sorting logic
    code = code.replace(
      /const pA = products\.find\(p => p\.id === a\.productId\);\s*const pB = products\.find\(p => p\.id === b\.productId\);/g,
      'const pA = a.product;\n    const pB = b.product;'
    );

    // Fix the mapping logic
    code = code.replace(
      /const product = products\.find\(p => p\.id === item\.productId\);/g,
      'const product = item.product;'
    );

    // We should also fix order.number to order.orderNumber just in case
    code = code.replace(/order\.number/g, 'order.orderNumber');

    fs.writeFileSync(path, code);
    console.log('Fixed ' + path);
  } else {
    console.log('File not found: ' + path);
  }
});
