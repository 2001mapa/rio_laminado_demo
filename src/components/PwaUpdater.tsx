'use client';
import { useEffect, useState, useRef } from 'react';
import { DownloadCloud, Loader2 } from 'lucide-react';
import { getPendingOrders } from '@/lib/offlineQueue';
import { createClient } from '@/utils/supabase/client';

export default function PwaUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [inFlightWrites, setInFlightWrites] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  
  // Para evitar dependencias en los onWriteStart/End, usamos ref
  const writesRef = useRef(0);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthId(data.user.id);
      }
    });
  }, []);

  // Monitor sync queue
  useEffect(() => {
    const checkQueue = async () => {
       if (!authId) return;
       const pending = await getPendingOrders(authId);
       const syncing = pending.some(o => o.status === 'syncing');
       setIsSyncing(syncing);
    };
    if (authId) {
      checkQueue();
      const interval = setInterval(checkQueue, 2000);
      return () => clearInterval(interval);
    }
  }, [authId]);

  // Monitor in-flight IDB writes
  useEffect(() => {
    const onWriteStart = () => {
      writesRef.current += 1;
      setInFlightWrites(writesRef.current);
    };
    const onWriteEnd = () => {
      writesRef.current = Math.max(0, writesRef.current - 1);
      setInFlightWrites(writesRef.current);
    };
    
    window.addEventListener('idb-write-start', onWriteStart);
    window.addEventListener('idb-write-end', onWriteEnd);
    
    return () => {
      window.removeEventListener('idb-write-start', onWriteStart);
      window.removeEventListener('idb-write-end', onWriteEnd);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window as any).workbox) {
      const wb = (window as any).workbox;
      
      const promptNewVersionAvailable = async (event: any) => {
        let sw = event?.sw;
        if (!sw && typeof wb.getSW === 'function') {
           sw = await wb.getSW();
        }
        if (sw) setWaitingWorker(sw);
      };

      wb.addEventListener('waiting', promptNewVersionAvailable);
      
      if (typeof wb.getSW === 'function') {
          wb.getSW().then((sw: ServiceWorker | undefined) => {
             if (sw && sw.state === 'installed' && navigator.serviceWorker.controller) {
                 setWaitingWorker(sw);
             }
          });
      }

      return () => {
        wb.removeEventListener('waiting', promptNewVersionAvailable);
      };
    }
  }, []);

  const reloadToUpdate = () => {
    if (waitingWorker) {
      setIsUpdating(true);
      setUpdateFailed(false);
      
      let controllerChanged = false;
      
      const onControllerChange = () => {
        controllerChanged = true;
        window.location.reload();
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Si despus de 5 segundos no tom control, mostramos opcin de reintento
      setTimeout(() => {
          if (!controllerChanged) {
              setIsUpdating(false);
              setUpdateFailed(true);
              navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          }
      }, 5000);
    }
  };

  const isWriting = inFlightWrites > 0;
  const canUpdate = !isSyncing && !isWriting && !isUpdating;

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-rio-ink text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700 flex items-center gap-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm">Nueva versin disponible</span>
          {!canUpdate && !isUpdating && (
            <span className="text-xs text-gray-300">
              {isWriting ? 'Guardando...' : 'Espera a que termine el envo...'}
            </span>
          )}
          {updateFailed && (
            <span className="text-xs text-red-400">Error al activar. Reintentar?</span>
          )}
        </div>
        <button 
          onClick={reloadToUpdate}
          disabled={!canUpdate}
          className="bg-rio-gold-dark hover:bg-rio-gold-light text-rio-ink disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
          {isUpdating ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
}
