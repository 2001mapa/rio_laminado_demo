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
    
    for (const order of pendingOrders) {
      const processOrder = async (order: PendingOrder) => {
          // Limpiar syncing huérfanos
          if (order.status === 'syncing' && typeof navigator !== 'undefined' && navigator.onLine) {
             await deps.updatePendingOrderStatus(order.clientRequestId, { status: 'failed_recoverable' });
             order.status = 'failed_recoverable';
          }

          const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

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

            // 1. Conciliación (Phase 4): Si el pedido tiene un estado incierto (pudo haberse enviado pero perdimos respuesta),
            // primero consultamos la base de datos por el clientRequestId antes de reintentar.
            if (order.status === 'failed_recoverable' || order.status === 'failed_intervention') {
                try {
                    const checkRes = await deps.checkOrderByRequestId(order.clientRequestId);
                    if (checkRes.success && checkRes.order) {
                        // El pedido ya existe! Lo quitamos de la cola
                        await deps.removePendingOrder(order.clientRequestId);
                        addToast(`Pedido ${checkRes.order.orderNumber} conciliado y enviado con éxito.`, 'success');
                        refreshData();
                        return;
                    }
                } catch (e) {
                    // Si falla la consulta, asumimos red caída y abortamos
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

      // Fase 4: Exclusión cruzada entre pestañas con Web Locks API
      if (typeof navigator !== 'undefined' && navigator.locks) {
          await navigator.locks.request(`rio-sync-${order.clientRequestId}`, { ifAvailable: true }, async (lock) => {
              if (lock) {
                  await processOrder(order);
              }
          });
      } else {
          if (!activeSyncs.has(order.clientRequestId)) {
              activeSyncs.add(order.clientRequestId);
              try {
                  await processOrder(order);
              } finally {
                  activeSyncs.delete(order.clientRequestId);
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
