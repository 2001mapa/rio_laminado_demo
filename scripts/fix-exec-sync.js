const fs = require('fs');

let c = fs.readFileSync('src/lib/useOfflineSync.ts', 'utf8');

const regex = /export async function executeSync\([\s\S]*?return closestNextRetry;\n\}/m;

const newExecuteSync = `export async function executeSync(
    sellerId: string, 
    refreshData: () => void, 
    bypassUUID?: string,
    deps = {
       getPendingOrders,
       updatePendingOrderStatus,
       removePendingOrder,
       createOrderAction,
       checkOrderByRequestId
    }
): Promise<number | null> {
    const pendingOrders = await deps.getPendingOrders(sellerId);
    const now = Date.now();
    let closestNextRetry: number | null = null;
    
    for (const staledOrder of pendingOrders) {
      const processOrder = async (lockName: string) => {
          // Re-leer IndexedDB despues de adquirir el lock (Fix 4)
          const currentOrders = await deps.getPendingOrders(sellerId);
          const order = currentOrders.find(o => o.clientRequestId === staledOrder.clientRequestId);
          if (!order) return; // Alguien más lo eliminó

          // Limpiar syncing huérfanos
          if (order.status === 'syncing' && typeof navigator !== 'undefined' && navigator.onLine) {
             await deps.updatePendingOrderStatus(order.clientRequestId, { status: 'failed_recoverable' });
             order.status = 'failed_recoverable';
          }

          const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

          if ((order.status === 'pending' || order.status === 'failed_recoverable' || order.status === 'failed_intervention') && isOnline) {
            const isBypass = bypassUUID === order.clientRequestId;
            
            // Si no es bypass (manual), verificar backoff
            if (!isBypass && (order.status === 'failed_recoverable' || order.status === 'failed_intervention')) {
               if (order.retryCount >= MAX_RETRIES) {
                   await deps.updatePendingOrderStatus(order.clientRequestId, { status: 'failed_intervention', lastError: 'Requiere intervención/Verificar con servidor. La respuesta pudo haberse perdido.' });
                   return;
               }
               const nextRetryAt = order.nextRetryAt ?? (order.createdAt + (Math.pow(2, order.retryCount) * BASE_DELAY_MS));
               if (now < nextRetryAt) {
                   if (!closestNextRetry || nextRetryAt < closestNextRetry) {
                       closestNextRetry = nextRetryAt;
                   }
                   return; // Esperar
               }
            }

            // 1. Conciliación (Phase 4)
            if (order.status === 'failed_recoverable' || order.status === 'failed_intervention') {
                try {
                    const checkRes = await deps.checkOrderByRequestId(order.clientRequestId);
                    if (checkRes.success && checkRes.order && checkRes.order.orderNumber) {
                        // El pedido ya existe! Lo quitamos de la cola
                        await deps.removePendingOrder(order.clientRequestId);
                        addToast(\`Pedido \${checkRes.order.orderNumber} conciliado y enviado con éxito.\`, 'success');
                        refreshData();
                        return;
                    }
                    if (!checkRes.success && !checkRes.notFound) {
                        // Error del servidor (ej. 500) pero NO es un notFound confirmadísimo.
                        // Abortamos este intento por precaución.
                        return;
                    }
                    // Si checkRes.notFound === true, continuamos al envío normal.
                } catch (e) {
                    // Si falla la consulta a nivel de red, asumimos red caída y abortamos
                    return;
                }
            }

            // 2. Intento de Envío
            await deps.updatePendingOrderStatus(order.clientRequestId, { status: 'syncing', lastError: undefined });
            
            try {
              const res = await deps.createOrderAction({
                customerId: order.customerId,
                items: order.items,
                clientRequestId: order.clientRequestId
              });

              // Strict order number check (Fix 2)
              if (res.success && res.order && res.order.orderNumber) {
                await deps.removePendingOrder(order.clientRequestId);
                refreshData();
              } else {
                const newRetryCount = order.retryCount + 1;
                const nextRetry = Date.now() + (Math.pow(2, newRetryCount) * BASE_DELAY_MS);
                
                if (res.code === 'BUSINESS_ERROR') {
                    await deps.updatePendingOrderStatus(order.clientRequestId, { 
                        status: 'failed_fatal', 
                        lastError: res.error || 'Rechazado por reglas de negocio.',
                        retryCount: newRetryCount,
                        nextRetryAt: nextRetry
                    });
                } else {
                    await deps.updatePendingOrderStatus(order.clientRequestId, { 
                        status: 'failed_recoverable', 
                        lastError: res.error || 'Error desconocido o respuesta sin ID.',
                        retryCount: newRetryCount,
                        nextRetryAt: nextRetry
                    });
                    if (!closestNextRetry || nextRetry < closestNextRetry) {
                        closestNextRetry = nextRetry;
                    }
                }
                refreshData();
              }
            } catch (error: any) {
              const newRetryCount = order.retryCount + 1;
              const nextRetry = Date.now() + (Math.pow(2, newRetryCount) * BASE_DELAY_MS);
              await deps.updatePendingOrderStatus(order.clientRequestId, { 
                  status: 'failed_recoverable', 
                  lastError: error.message || 'Error de red durante envío.',
                  retryCount: newRetryCount,
                  nextRetryAt: nextRetry
              });
              if (!closestNextRetry || nextRetry < closestNextRetry) {
                  closestNextRetry = nextRetry;
              }
              refreshData();
            }
          }
      };

      const lockName = \`rio-sync-\${staledOrder.clientRequestId}\`;
      
      // Fase 4: Exclusión cruzada entre pestañas con Web Locks API
      if (typeof navigator !== 'undefined' && navigator.locks) {
          await navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => {
              if (lock) {
                  await processOrder(lockName);
              }
          });
      } else {
          // Fallback seguro usando LocalStorage para locks si Web Locks no existe
          const fallbackLockName = \`lock_\${lockName}\`;
          const currentLock = typeof window !== 'undefined' ? window.localStorage.getItem(fallbackLockName) : null;
          
          if (!currentLock || (Date.now() - parseInt(currentLock)) > 30000) {
              if (typeof window !== 'undefined') window.localStorage.setItem(fallbackLockName, Date.now().toString());
              try {
                  await processOrder(lockName);
              } finally {
                  if (typeof window !== 'undefined') window.localStorage.removeItem(fallbackLockName);
              }
          }
      }
    }
    
    return closestNextRetry;
}`;

c = c.replace(regex, newExecuteSync);

fs.writeFileSync('src/lib/useOfflineSync.ts', c);
