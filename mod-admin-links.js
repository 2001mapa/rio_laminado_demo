const fs = require('fs');

// Order details page
let orderCode = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');
if (!orderCode.includes('/admin/historial?search=')) {
  orderCode = orderCode.replace(
    /<h1 className="text-3xl font-serif font-black text-rio-ink mb-1 md:mb-0">Pedido \{order\.orderNumber\}<\/h1>/,
    `<div className="flex items-center gap-4">
      <h1 className="text-3xl font-serif font-black text-rio-ink mb-1 md:mb-0">Pedido {order.orderNumber}</h1>
      <Link href={\`/admin/historial?search=\${order.orderNumber}\`} className="text-xs bg-rio-ink text-white px-3 py-1.5 rounded-full font-bold uppercase tracking-wider hover:bg-rio-ink/80 transition-colors flex items-center gap-1">
        <Activity className="w-3 h-3" /> Bitácora
      </Link>
    </div>`
  );
  // Import Link and Activity if not present
  if (!orderCode.includes('import Link')) {
    orderCode = `import Link from 'next/link';\n` + orderCode;
  }
  if (!orderCode.includes('import {') || !orderCode.includes('Activity')) {
     orderCode = orderCode.replace(/import \{.*?\} from 'lucide-react';/, (match) => {
       if (!match.includes('Activity')) return match.replace('{', '{ Activity,');
       return match;
     });
  }
  fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', orderCode);
  console.log("Updated order details with audit link");
}

// Inventory page Product Modal (we need to find where the modal is rendered or product details are shown)
let invCode = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');
if (!invCode.includes('/admin/historial?search=')) {
  invCode = invCode.replace(
    /<h2 className="text-2xl font-serif font-black text-rio-ink pr-8 leading-tight">[\s\S]*?\{editingProduct\.name\}[\s\S]*?<\/h2>/,
    `$&
     <Link href={\`/admin/historial?search=\${editingProduct.sku}\`} className="mt-2 inline-flex items-center text-[11px] font-bold uppercase tracking-wider bg-rio-surface-muted text-rio-ink border border-rio-border px-3 py-1.5 rounded-full hover:bg-rio-border transition-colors">
       <Activity className="w-3.5 h-3.5 mr-1" />
       Ver bitácora de cambios
     </Link>`
  );
  if (!invCode.includes('Activity')) {
     invCode = invCode.replace(/import \{.*?\} from 'lucide-react';/, (match) => {
       if (!match.includes('Activity')) return match.replace('{', '{ Activity,');
       return match;
     });
  }
  if (!invCode.includes('import Link')) {
    invCode = `import Link from 'next/link';\n` + invCode;
  }
  fs.writeFileSync('src/app/admin/inventario/page.tsx', invCode);
  console.log("Updated inventory modal with audit link");
}
