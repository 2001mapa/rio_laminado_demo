const fs = require('fs');

function replaceAlerts(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');

  // Regex that captures the content inside alert(...)
  // Note: this simple regex works if there are no nested parentheses inside the alert message.
  // For safety, we will just use regex for simple ones and do the rest carefully.
  code = code.replace(/alert\((['"`].*?['"`])\);/g, "window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: $1, type: 'error' } }));");
  
  // Handle alert(e.message)
  code = code.replace(/alert\(e\.message\);/g, "window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: e.message, type: 'error' } }));");
  
  // Handle alert('Error: ' + ...)
  code = code.replace(/alert\('Error: ' \+ \(result\?\.error \|\| ''\)\);/g, "window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: 'Error: ' + (result?.error || ''), type: 'error' } }));");

  fs.writeFileSync(path, code);
  console.log('Replaced alerts in ' + path);
}

const files = [
  'src/app/admin/ClientLayout.tsx',
  'src/app/admin/pedidos/[id]/page.tsx',
  'src/app/admin/pedidos/[id]/verificar/page.tsx',
  'src/app/cliente/carrito/page.tsx',
  'src/app/vendedor/ClientLayout.tsx',
  'src/app/vendedor/nueva-venta/page.tsx'
];

files.forEach(replaceAlerts);
