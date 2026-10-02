const fs = require('fs');

let c = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

c = c.replace(/const \{ customers, products, checkoutSeller \} = useDemo\(\);/, "const { customers, products, checkoutSeller, syncPendingOrders } = useDemo();");

const oldHandleRetry = `
  const handleRetry = async (order: PendingOrder) => {
      const res = await checkoutSeller(order.customerId!, order.items.map(i => ({ product: { id: i.productId } as any, quantity: i.quantity, sizes: i.sizeDetails })) as any, order.clientRequestId);
      if (res.success) {
         await removePendingOrder(order.clientRequestId);
         addToast("Venta confirmada exitosamente: " + (res.order?.orderNumber || ''));
      } else {
         addToast("Error al reintentar: " + (res.error || ''));
      }
      if (sellerId) getPendingOrders(sellerId).then(setPendingQueue);
  };
`;
const newHandleRetry = `
  const handleRetry = async (order: PendingOrder) => {
      await syncPendingOrders(order.clientRequestId);
      if (sellerId) getPendingOrders(sellerId).then(setPendingQueue);
  };
`;
c = c.replace(oldHandleRetry.trim(), newHandleRetry.trim());


const oldEffect2 = `
  // Intentar rehidratar cuando products y customers estén disponibles
  useEffect(() => {
    if (offlineDraftWaiting && products.length > 0) {
        const restoredCart = offlineDraftWaiting.cart.map((draftItem: any) => {
           const product = products.find(p => p.id === draftItem.productId);
           return product ? { product, quantity: draftItem.quantity, sizes: draftItem.sizes } : null;
        }).filter(Boolean);
        
        if (restoredCart.length > 0) {
            setCartItems(restoredCart as any[]);
            if (offlineDraftWaiting.clientId) {
               const cust = customers.find(c => c.id === offlineDraftWaiting.clientId);
               if (cust) setSelectedCustomer(cust);
            }
        }
        setOfflineDraftWaiting(null);
        setIsDraftLoaded(true);
    } else if (offlineDraftWaiting && products.length === 0 && !navigator.onLine) {
        // Estamos offline y no hay catálogo. No podemos rehidratar.
        // Mantenemos offlineDraftWaiting intacto y no permitimos sobrescribir el IDB.
    }
  }, [products, customers, offlineDraftWaiting]);
`;
const newEffect2 = `
  useEffect(() => {
    if (offlineDraftWaiting && products.length > 0 && customers.length > 0) {
        let allResolved = true;
        const restoredCart = offlineDraftWaiting.cart.map((draftItem: any) => {
           const product = products.find(p => p.id === draftItem.productId);
           if (!product) allResolved = false;
           return product ? { product, quantity: draftItem.quantity, sizes: draftItem.sizes } : null;
        }).filter(Boolean);
        
        let clientResolved = true;
        if (offlineDraftWaiting.clientId) {
           const cust = customers.find(c => c.id === offlineDraftWaiting.clientId);
           if (!cust) clientResolved = false;
        }

        if (allResolved && clientResolved) {
            if (restoredCart.length > 0) {
                setCartItems(restoredCart as any[]);
                if (offlineDraftWaiting.clientId) {
                   const cust = customers.find(c => c.id === offlineDraftWaiting.clientId);
                   if (cust) setSelectedCustomer(cust);
                }
            }
            setOfflineDraftWaiting(null);
            setIsDraftLoaded(true);
        }
    }
  }, [products, customers, offlineDraftWaiting]);
`;
c = c.replace(oldEffect2.trim(), newEffect2.trim());

const oldTitle = `
      {offlineDraftWaiting && products.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold">Borrador esperando catálogo</p>
            <p className="text-sm mt-1">Tienes una venta guardada, pero la aplicación está sin conexión y no pudo cargar el catálogo de productos. El borrador está a salvo y se restaurará al reconectar.</p>
          </div>
        </div>
      )}
`;
const newTitle = `
      {offlineDraftWaiting && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold">Requiere recargar catálogo</p>
            <p className="text-sm mt-1">Tienes una venta guardada con productos o clientes que aún no se han cargado en el dispositivo. Conéctate a internet para restaurarla de forma segura. Tus datos locales están a salvo.</p>
          </div>
        </div>
      )}
`;
c = c.replace(oldTitle.trim(), newTitle.trim());

// We must also update the queue UI to show failed_intervention correctly
const oldStatusText = `Estado: {order.status === 'pending' ? 'Pendiente de conexión' : order.status === 'syncing' ? 'Sincronizando...' : order.status === 'failed_recoverable' ? 'Reintentando...' : 'Requiere revisión'}`;
const newStatusText = `Estado: {order.status === 'pending' ? 'Pendiente de conexión' : order.status === 'syncing' ? 'Sincronizando...' : order.status === 'failed_recoverable' ? 'Reintentando...' : order.status === 'failed_intervention' ? 'Requiere intervención/Verificar con servidor' : 'Requiere revisión'}`;
c = c.replace(oldStatusText, newStatusText);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', c);
