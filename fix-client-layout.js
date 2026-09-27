const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/ClientLayout.tsx', 'utf8');

// 1. Remove initial dependency on `products` from context for baseline
const oldInitialEffect = `    if (!isLoaded) return;
    if (knownStatuses === null) {
      if (currentCustomer && currentCustomer.id) {
        const initialOrd: Record<string, string> = {};
        orders.forEach(o => {
          if (o.customerId === currentCustomer.id) {
            initialOrd[o.id] = PUBLIC_STATES[o.status as InternalOrderState] || o.status;
          }
        });
        
        // Handle notified cache
        const storedNotified = localStorage.getItem('rio_notified_orders');
        let notifiedCache: Record<string, string> = storedNotified ? JSON.parse(storedNotified) : {};
        
        const newAlerts: typeof statusAlerts = [];
        for (const [id, st] of Object.entries(initialOrd)) {
           if (notifiedCache[id] !== st) {
              if (notifiedCache[id] !== undefined) {
                 let msg = \`Tu pedido \${orders.find(o => o.id === id)?.number} se ha actualizado a: \${st}\`;
                 if (st === 'Pedido enviado') {
                    msg = \`Tu pedido \${orders.find(o => o.id === id)?.number} fue enviado\`;
                 }
                 newAlerts.push({
                   id,
                   number: orders.find(o => o.id === id)?.number || '',
                   newPublicStatus: st,
                   message: msg
                 });
              }
              notifiedCache[id] = st;
           }
        }
        setKnownStatuses(initialOrd);

        if (newAlerts.length > 0) {
           setStatusAlerts(prev => [...prev, ...newAlerts]);
           localStorage.setItem('rio_notified_orders', JSON.stringify(notifiedCache));
        }

        setKnownProductIds(new Set(products.map(p => p.id)));
        const initialStocks: Record<string, {p: number, r: number}> = {};
        products.forEach(p => { initialStocks[p.id] = { p: p.physicalStock, r: p.reservedStock }; });
        setProductStocks(initialStocks);
      }
    }
  }, [isLoaded, orders, products, currentCustomer, knownStatuses]);`;

const newInitialEffect = `    if (!isLoaded) return;
    if (knownStatuses === null) {
      if (currentCustomer && currentCustomer.id) {
        const initialOrd: Record<string, string> = {};
        orders.forEach(o => {
          if (o.customerId === currentCustomer.id) {
            initialOrd[o.id] = PUBLIC_STATES[o.status as InternalOrderState] || o.status;
          }
        });
        
        const storedNotified = localStorage.getItem('rio_notified_orders');
        let notifiedCache: Record<string, string> = storedNotified ? JSON.parse(storedNotified) : {};
        
        const newAlerts: typeof statusAlerts = [];
        for (const [id, st] of Object.entries(initialOrd)) {
           if (notifiedCache[id] !== st) {
              if (notifiedCache[id] !== undefined) {
                 let msg = \`Tu pedido \${orders.find(o => o.id === id)?.number} se ha actualizado a: \${st}\`;
                 if (st === 'Pedido enviado') {
                    msg = \`Tu pedido \${orders.find(o => o.id === id)?.number} fue enviado\`;
                 }
                 newAlerts.push({
                   id,
                   number: orders.find(o => o.id === id)?.number || '',
                   newPublicStatus: st,
                   message: msg
                 });
              }
              notifiedCache[id] = st;
           }
        }
        setKnownStatuses(initialOrd);

        if (newAlerts.length > 0) {
           setStatusAlerts(prev => [...prev, ...newAlerts]);
           localStorage.setItem('rio_notified_orders', JSON.stringify(notifiedCache));
        }

        // Fetch product baseline silently
        getClientActiveProductsDigest().then(resProd => {
           if (resProd.success && resProd.products) {
              const fetchedP = resProd.products as {id: string, physicalStock: number, reservedStock: number}[];
              setKnownProductIds(new Set(fetchedP.map(p => p.id)));
              const initialStocks: Record<string, {p: number, r: number}> = {};
              fetchedP.forEach(p => { initialStocks[p.id] = { p: p.physicalStock, r: p.reservedStock }; });
              setProductStocks(initialStocks);
           }
        });
      }
    }
  }, [isLoaded, orders, currentCustomer, knownStatuses]);`;

if (code.includes(oldInitialEffect)) {
  code = code.replace(oldInitialEffect, newInitialEffect);
} else {
  // Try regex if spacing is weird
  const regex = /setKnownProductIds\(new Set\(products\.map\(p => p\.id\)\)\);[\s\S]*?setProductStocks\(initialStocks\);\n\s*\}\n\s*\}\n\s*\}, \[isLoaded, orders, products, currentCustomer, knownStatuses\]\);/;
  const fallbackNew = `// Fetch product baseline silently
        getClientActiveProductsDigest().then(resProd => {
           if (resProd.success && resProd.products) {
              const fetchedP = resProd.products as {id: string, physicalStock: number, reservedStock: number}[];
              setKnownProductIds(new Set(fetchedP.map(p => p.id)));
              const initialStocks: Record<string, {p: number, r: number}> = {};
              fetchedP.forEach(p => { initialStocks[p.id] = { p: p.physicalStock, r: p.reservedStock }; });
              setProductStocks(initialStocks);
           }
        });
      }
    }
  }, [isLoaded, orders, currentCustomer, knownStatuses]);`;
  if (code.match(regex)) {
    code = code.replace(regex, fallbackNew);
  }
}

// 2. Change 15000 to 60000 and dispatch silent refresh event
const oldPollEnd = `          if (shouldRefresh) {
            refreshData();
          }
        } catch (e) {
          console.error("Error polling client updates", e);
        } finally {
          isPolling = false;
        }
      }, 15000);`;

const newPollEnd = `          if (shouldRefresh) {
            refreshData();
            window.dispatchEvent(new CustomEvent('rio:silent_refresh_catalog'));
          }
        } catch (e) {
          console.error("Error polling client updates", e);
        } finally {
          isPolling = false;
        }
      }, 60000);`;

code = code.replace(oldPollEnd, newPollEnd);

fs.writeFileSync('src/app/cliente/ClientLayout.tsx', code);
console.log('Fixed ClientLayout polling and baseline');
