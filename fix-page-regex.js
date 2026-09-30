const fs = require('fs');
let c = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

// The chunk we want to MOVE is:
/*
  const contextOrder = orders.find(o => o.id === resolvedParams.id);
  const order = contextOrder || fetchedOrder;
  
  if (isLoadingOrder && !order) return <div className="p-4 text-rio-muted">Cargando pedido...</div>;
  if (orderError && !order) return <div className="p-4 text-red-500">{orderError}</div>;
  

  if (!order) return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;
*/

// Let's use regex to extract it and remove it.
const chunkRegex = /  const contextOrder = orders\.find[\s\S]*?if \(!order\) return <div className="p-4 text-rio-muted">Pedido no encontrado<\/div>;\n/;

const match = c.match(chunkRegex);
if (!match) {
    console.error("COULD NOT FIND CHUNK!");
    process.exit(1);
}

const chunk = match[0];
c = c.replace(chunk, ''); // Remove it from its current position

// We need to inject `const contextOrder = ... \n const order = ...` BEFORE handleTransition
const handleTransitionIndex = c.indexOf('const handleTransition = async');
if (handleTransitionIndex === -1) {
    console.error("COULD NOT FIND handleTransition");
    process.exit(1);
}

c = c.substring(0, handleTransitionIndex) + 
    "const contextOrder = orders.find(o => o.id === resolvedParams.id);\n  const order = contextOrder || fetchedOrder;\n\n  " +
    c.substring(handleTransitionIndex);

// And we need to inject the early returns AFTER handleTransition
// handleTransition ends around `};\n`
// Let's find `const customer = ` which is immediately after where the chunk used to be (and where we want the early returns).
const customerIndex = c.indexOf('const customer = customers.find');
if (customerIndex === -1) {
    console.error("COULD NOT FIND customer");
    process.exit(1);
}

const earlyReturns = `  if (isLoadingOrder && !order) return <div className="p-4 text-rio-muted">Cargando pedido...</div>;
  if (orderError && !order) return <div className="p-4 text-red-500">{orderError}</div>;
  if (!order) return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;\n\n  `;

c = c.substring(0, customerIndex) + earlyReturns + c.substring(customerIndex);

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', c);
console.log("Successfully moved block.");
