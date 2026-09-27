const fs = require('fs');

let code = fs.readFileSync('src/app/cliente/ClientLayout.tsx', 'utf8');

const checkFunc = `
      let isPolling = false;
      const checkClientUpdates = async () => {
        if (document.hidden || isPolling) return;
        isPolling = true;
        try {
          // 1. Poll orders
          const resOrders = await getClientOrderStatuses();
          let shouldRefresh = false;
          const newAlerts: typeof statusAlerts = [];
  
          if (resOrders.success && resOrders.orders) {
            const fetchedOrders = resOrders.orders as {id: string, number: string, status: string}[];
            const newStatuses = { ...knownStatuses };
            
            for (const order of fetchedOrders) {
              const publicStatus = PUBLIC_STATES[order.status as InternalOrderState] || order.status;
              const oldPublicStatus = knownStatuses[order.id];
              
              if (oldPublicStatus && oldPublicStatus !== publicStatus) {
                shouldRefresh = true;
                
                let msg = \`Tu pedido \${order.number} se ha actualizado a: \${publicStatus}\`;
                if (publicStatus === 'Pedido enviado') {
                  msg = \`Tu pedido \${order.number} fue enviado\`;
                } else if (publicStatus === 'Estamos preparando tu pedido') {
                  msg = \`Estamos preparando tu pedido \${order.number}\`;
                }
  
                newAlerts.push({
                  id: order.id,
                  number: order.number,
                  newPublicStatus: publicStatus,
                  message: msg
                });
              }
              newStatuses[order.id] = publicStatus;
            }
            if (shouldRefresh) setKnownStatuses(newStatuses);
          }
  
          // 2. Poll products
          const resProd = await getClientActiveProductsDigest();
          if (resProd.success && resProd.products) {
            const fetchedP = resProd.products as {id: string, physicalStock: number, reservedStock: number}[];
            let updatedProducts = false;
            let hasNewReferences = false;
            const newStocks = { ...productStocks };
            const newKnownIds = new Set(knownProductIds);
  
            for (const p of fetchedP) {
               if (!knownProductIds.has(p.id)) {
                  hasNewReferences = true;
                  updatedProducts = true;
                  newKnownIds.add(p.id);
                  newStocks[p.id] = { p: p.physicalStock, r: p.reservedStock };
               } else {
                  const old = productStocks[p.id];
                  if (!old || old.p !== p.physicalStock || old.r !== p.reservedStock) {
                     updatedProducts = true;
                     newStocks[p.id] = { p: p.physicalStock, r: p.reservedStock };
                  }
               }
            }
            
            if (updatedProducts) {
               setKnownProductIds(newKnownIds);
               setProductStocks(newStocks);
               shouldRefresh = true;
  
               if (hasNewReferences) {
                  newAlerts.push({
                    id: 'new-products-' + Date.now(),
                    number: 'Catálogo',
                    newPublicStatus: 'Novedad',
                    message: 'Hay nuevos productos en el catálogo.',
                    isProductAlert: true
                  });
               }
            }
          }
          
          if (shouldRefresh) {
            await refreshData();
            if (newAlerts.length > 0) {
               setStatusAlerts(prev => [...prev, ...newAlerts]);
               
               // Update localStorage so they don't get re-notified if they reload
               const notifiedCache = JSON.parse(localStorage.getItem('rio_notified_orders') || '{}');
               newAlerts.forEach(a => {
                  if (!a.isProductAlert) {
                     notifiedCache[a.id] = a.newPublicStatus;
                  }
               });
               localStorage.setItem('rio_notified_orders', JSON.stringify(notifiedCache));
            }
          }
        } catch (e) {
          console.error("Error polling client updates");
        } finally {
          isPolling = false;
        }
      };

      const intervalId = setInterval(checkClientUpdates, 15000);
      
      const handleFocus = () => {
        if (!document.hidden) checkClientUpdates();
      };
      
      window.addEventListener('visibilitychange', handleFocus);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('visibilitychange', handleFocus);
        window.removeEventListener('focus', handleFocus);
      };
`;

const oldTarget = `      let isPolling = false;
      const intervalId = setInterval(async () => {
        if (document.hidden || isPolling) return;
        isPolling = true;
        try {
          // 1. Poll orders
          const resOrders = await getClientOrderStatuses();
          let shouldRefresh = false;
          const newAlerts: typeof statusAlerts = [];
  
          if (resOrders.success && resOrders.orders) {
            const fetchedOrders = resOrders.orders as {id: string, number: string, status: string}[];
            const newStatuses = { ...knownStatuses };
            
            for (const order of fetchedOrders) {
              const publicStatus = PUBLIC_STATES[order.status as InternalOrderState] || order.status;
              const oldPublicStatus = knownStatuses[order.id];
              
              if (oldPublicStatus && oldPublicStatus !== publicStatus) {
                shouldRefresh = true;
                
                let msg = \`Tu pedido \${order.number} se ha actualizado a: \${publicStatus}\`;
                if (publicStatus === 'Pedido enviado') {
                  msg = \`Tu pedido \${order.number} fue enviado\`;
                } else if (publicStatus === 'Estamos preparando tu pedido') {
                  msg = \`Estamos preparando tu pedido \${order.number}\`;
                }
  
                newAlerts.push({
                  id: order.id,
                  number: order.number,
                  newPublicStatus: publicStatus,
                  message: msg
                });
              }
              newStatuses[order.id] = publicStatus;
            }
            if (shouldRefresh) setKnownStatuses(newStatuses);
          }
  
          // 2. Poll products
          const resProd = await getClientActiveProductsDigest();
          if (resProd.success && resProd.products) {
            const fetchedP = resProd.products as {id: string, physicalStock: number, reservedStock: number}[];
            let updatedProducts = false;
            let hasNewReferences = false;
            const newStocks = { ...productStocks };
            const newKnownIds = new Set(knownProductIds);
  
            for (const p of fetchedP) {
               if (!knownProductIds.has(p.id)) {
                  hasNewReferences = true;
                  updatedProducts = true;
                  newKnownIds.add(p.id);
                  newStocks[p.id] = { p: p.physicalStock, r: p.reservedStock };
               } else {
                  const old = productStocks[p.id];
                  if (!old || old.p !== p.physicalStock || old.r !== p.reservedStock) {
                     updatedProducts = true;
                     newStocks[p.id] = { p: p.physicalStock, r: p.reservedStock };
                  }
               }
            }
            
            if (updatedProducts) {
               setKnownProductIds(newKnownIds);
               setProductStocks(newStocks);
               shouldRefresh = true;
  
               if (hasNewReferences) {
                  newAlerts.push({
                    id: 'new-products-' + Date.now(),
                    number: 'Catálogo',
                    newPublicStatus: 'Novedad',
                    message: 'Hay nuevos productos en el catálogo.',
                    isProductAlert: true
                  });
               }
            }
          }
          
          if (shouldRefresh) {
            await refreshData();
            if (newAlerts.length > 0) {
               setStatusAlerts(prev => [...prev, ...newAlerts]);
               
               // Update localStorage so they don't get re-notified if they reload
               const notifiedCache = JSON.parse(localStorage.getItem('rio_notified_orders') || '{}');
               newAlerts.forEach(a => {
                  if (!a.isProductAlert) {
                     notifiedCache[a.id] = a.newPublicStatus;
                  }
               });
               localStorage.setItem('rio_notified_orders', JSON.stringify(notifiedCache));
            }
          }
        } catch (e) {
          console.error("Error polling client updates");
        } finally {
          isPolling = false;
        }
      }, 15000);
      
      return () => clearInterval(intervalId);`;

code = code.replace(oldTarget, checkFunc);
fs.writeFileSync('src/app/cliente/ClientLayout.tsx', code);
console.log('Fixed polling visibility bug in ClientLayout');
