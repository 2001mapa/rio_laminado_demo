import { useEffect, useCallback, useRef } from 'react';
import { getPendingOrders, updatePendingOrderStatus, removePendingOrder, PendingOrder } from './offlineQueue';
import { createClient } from '@/utils/supabase/client';
import { createOrder as createOrderAction, checkOrderByRequestId } from '@/app/actions/orders';
import { addToast } from './toast';

export const activeSyncs = new Set<string>();
export const MAX_RETRIES = 5;
export const BASE_DELAY_MS = 2000;

export async function executeSync(
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
                        addToast(`Pedido ${checkRes.order.orderNumber} conciliado y enviado con éxito.`, 'success');
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
                newCustomerData: order.newCustomerData,
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
                
                if (res.code === 'CONFLICT_ERROR') {
                    await deps.updatePendingOrderStatus(order.clientRequestId, { 
                        status: 'conflict', 
                        lastError: res.error || 'Conflicto de inventario.',
                        conflicts: (res as any).conflicts
                    });
                } else if (res.code === 'BUSINESS_ERROR') {
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

      const lockName = `rio-sync-${staledOrder.clientRequestId}`;
      
      // Fase 4: Exclusión cruzada entre pestañas con Web Locks API
      if (typeof navigator !== 'undefined' && navigator.locks) {
          await navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => {
              if (lock) {
                  await processOrder(lockName);
              }
          });
      } else {
          // Fallback usando LocalStorage para navegadores sin Web Locks.
          // NOTA DE SEGURIDAD: La lectura/escritura en LocalStorage no es atómica. 
          // En un escenario de carrera (race condition) muy ajustado, dos pestañas 
          // podrían leer null simultáneamente y ambas enviar la petición al servidor.
          // Esto es SEGURO únicamente porque el servidor actúa como autoridad final de 
          // idempotencia utilizando el clientRequestId. El servidor procesará la primera
          // petición y devolverá error en la segunda, previniendo duplicados.
          const fallbackLockName = `lock_${lockName}`;
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
}

export function useOfflineSync(refreshData: () => void) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const syncPendingOrders = useCallback(async (bypassUUID?: string) => {
    if (typeof window === 'undefined') return;
    
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    // Exclusión de sesión: si expiró o no hay usuario, pausar todo
    if (!authData.user) return;
    
    const closestNextRetry = await executeSync(authData.user.id, refreshData, bypassUUID);

    if (closestNextRetry && closestNextRetry > Date.now()) {
        const delay = closestNextRetry - Date.now();
        timerRef.current = setTimeout(() => syncPendingOrders(), delay);
    }

  }, [refreshData]);

  useEffect(() => {
    const handleOnline = () => syncPendingOrders();
    // Fase 4: Reanudar al volver al primer plano (App Load / Foreground)
    const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
            syncPendingOrders();
        }
    };
    
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    
    // Initial sync
    syncPendingOrders();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncPendingOrders]);

  return { syncPendingOrders };
}
