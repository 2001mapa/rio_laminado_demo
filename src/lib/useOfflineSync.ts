import { useEffect, useCallback, useRef } from 'react';
import { getPendingOrders, updatePendingOrderStatus, removePendingOrder } from './offlineQueue';
import { createClient } from '@/utils/supabase/client';
import { createOrder as createOrderAction } from '@/app/actions/orders';
import { PendingOrder } from './offlineQueue';

export const activeSyncs = new Set<string>();
export const MAX_RETRIES = 5;
export const BASE_DELAY_MS = 2000;

// Lógica pura y testeable con Inyección de Dependencias
export async function executeSync(
    sellerId: string, 
    refreshData: () => void, 
    bypassUUID?: string,
    deps = {
       getPendingOrders,
       updatePendingOrderStatus,
       removePendingOrder,
       createOrderAction
    }
): Promise<number | null> {
    const pendingOrders = await deps.getPendingOrders(sellerId);
    const now = Date.now();
    let closestNextRetry: number | null = null;
    
    for (const order of pendingOrders) {
      if (activeSyncs.has(order.clientRequestId)) continue;

      if (order.status === 'syncing' && typeof navigator !== 'undefined' && navigator.onLine) {
         await deps.updatePendingOrderStatus(order.clientRequestId, { status: 'failed_recoverable' });
         order.status = 'failed_recoverable';
      }

      const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

      if ((order.status === 'pending' || order.status === 'failed_recoverable') && isOnline) {
        
        const isBypass = bypassUUID === order.clientRequestId;
        
        if (order.status === 'failed_recoverable' && !isBypass) {
           if (order.retryCount >= MAX_RETRIES) {
               await deps.updatePendingOrderStatus(order.clientRequestId, { status: 'failed_intervention', lastError: 'Requiere intervención/Verificar con servidor. La respuesta pudo haberse perdido. No descartar, verifique con administración.' });
               continue;
           }
           const nextRetryAt = order.nextRetryAt || (order.createdAt + (Math.pow(2, order.retryCount) * BASE_DELAY_MS));
           if (now < nextRetryAt) {
               if (!closestNextRetry || nextRetryAt < closestNextRetry) {
                   closestNextRetry = nextRetryAt;
               }
               continue;
           }
        }

        activeSyncs.add(order.clientRequestId);
        try {
          await deps.updatePendingOrderStatus(order.clientRequestId, { 
             status: 'syncing', 
             lastAttemptAt: now 
          });
          
          const res = await deps.createOrderAction({
            customerId: order.customerId,
            items: order.items,
            clientRequestId: order.clientRequestId
          });
          
          if (res.success && res.order && res.order.orderNumber) {
            await deps.removePendingOrder(order.clientRequestId);
            refreshData();
          } else {
            if (res.code === 'NETWORK_OR_DB_ERROR' || !res.code) {
               const nextRetry = now + (Math.pow(2, order.retryCount + 1) * BASE_DELAY_MS);
               await deps.updatePendingOrderStatus(order.clientRequestId, { 
                 status: 'failed_recoverable', 
                 lastError: res.error || 'Error temporal del servidor',
                 retryCount: order.retryCount + 1,
                 lastAttemptAt: now,
                 nextRetryAt: nextRetry
               });
               if (!closestNextRetry || nextRetry < closestNextRetry) closestNextRetry = nextRetry;
            } else {
               await deps.updatePendingOrderStatus(order.clientRequestId, { 
                 status: 'failed_fatal', 
                 lastError: res.error || 'Rechazo del servidor' 
               });
            }
          }
        } catch (error: any) {
          const nextRetry = now + (Math.pow(2, order.retryCount + 1) * BASE_DELAY_MS);
          await deps.updatePendingOrderStatus(order.clientRequestId, { 
            status: 'failed_recoverable',
            lastError: error.message,
            retryCount: order.retryCount + 1,
            lastAttemptAt: now,
            nextRetryAt: nextRetry
          });
          if (!closestNextRetry || nextRetry < closestNextRetry) closestNextRetry = nextRetry;
        } finally {
          activeSyncs.delete(order.clientRequestId);
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
    if (!authData.user) return;
    
    const closestNextRetry = await executeSync(authData.user.id, refreshData, bypassUUID);

    if (closestNextRetry && closestNextRetry > Date.now()) {
        const delay = closestNextRetry - Date.now();
        timerRef.current = setTimeout(() => syncPendingOrders(), delay);
    }

  }, [refreshData]);

  useEffect(() => {
    const handleOnline = () => syncPendingOrders();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleOnline);
    
    syncPendingOrders();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncPendingOrders]);

  return { syncPendingOrders };
}
