const fs = require('fs');

const file = 'src/app/admin/pedidos/[id]/page.tsx';
let c = fs.readFileSync(file, 'utf8');

const target1 = `const [trackingNumber, setTrackingNumber] = useState('');
  
  const { updateGroupInvoice } = useDemo();`;

const replacement1 = `const [trackingNumber, setTrackingNumber] = useState('');
  const { updateGroupInvoice } = useDemo();
  
  const contextOrder = orders.find(o => o.id === resolvedParams.id);
  const order = contextOrder || fetchedOrder;`;

c = c.replace(target1, replacement1);

const target2 = `const contextOrder = orders.find(o => o.id === resolvedParams.id);
  const order = contextOrder || fetchedOrder;
  
  if (isLoadingOrder && !order) return <div className="p-4 text-rio-muted">Cargando pedido...</div>;
  if (orderError && !order) return <div className="p-4 text-red-500">{orderError}</div>;
  

  if (!order) return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;`;

const replacement2 = `if (isLoadingOrder && !order) return <div className="p-4 text-rio-muted">Cargando pedido...</div>;
  if (orderError && !order) return <div className="p-4 text-red-500">{orderError}</div>;
  if (!order) return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;`;

c = c.replace(target2, replacement2);

fs.writeFileSync(file, c);
console.log("Fixed page.tsx ordering");
