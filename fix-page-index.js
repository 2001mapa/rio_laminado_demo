const fs = require('fs');
let c = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

const start = c.indexOf('  const contextOrder = orders.find(o => o.id === resolvedParams.id);');
const endMarker = 'Pedido no encontrado</div>;';
const end = c.indexOf(endMarker) + endMarker.length;

if (start === -1 || end < endMarker.length) {
    console.log("Could not find bounds");
    process.exit(1);
}

const chunk = c.substring(start, end);
c = c.substring(0, start) + c.substring(end);

const handleTransitionIndex = c.indexOf('  const handleTransition = async');
c = c.substring(0, handleTransitionIndex) + 
    "  const contextOrder = orders.find(o => o.id === resolvedParams.id);\n  const order = contextOrder || fetchedOrder;\n\n" +
    c.substring(handleTransitionIndex);

const customerIndex = c.indexOf('  const customer = customers.find(c => c.id === order.customerId);');
const earlyReturns = `  if (isLoadingOrder && !order) return <div className="p-4 text-rio-muted">Cargando pedido...</div>;
  if (orderError && !order) return <div className="p-4 text-red-500">{orderError}</div>;
  if (!order) return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;\n\n`;

c = c.substring(0, customerIndex) + earlyReturns + c.substring(customerIndex);

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', c);
console.log("Done");
