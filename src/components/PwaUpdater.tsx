'use client';
import { useEffect, useState } from 'react';
import { DownloadCloud, Loader2 } from 'lucide-react';
import { getPendingOrders } from '@/lib/offlineQueue';
import { createClient } from '@/utils/supabase/client';

export default function PwaUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthId(data.user.id);
      } else {
        setCanUpdate(true);
      }
    });
  }, []);

  useEffect(() => {
    const checkQueue = async () => {
       if (!authId) return;
       const pending = await getPendingOrders(authId);
       const isSyncing = pending.some(o => o.status === 'syncing');
       setCanUpdate(!isSyncing);
    };
    if (authId) {
      checkQueue();
      const interval = setInterval(checkQueue, 2000);
      return () => clearInterval(interval);
    }
  }, [authId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window as any).workbox) {
      const wb = (window as any).workbox;
      
      const promptNewVersionAvailable = (event: any) => {
        setWaitingWorker(wb.getSW ? wb.getSW() : event.sw);
      };

      wb.addEventListener('waiting', promptNewVersionAvailable);
      
      wb.getSW().then((sw: ServiceWorker | undefined) => {
         if (sw && sw.state === 'installed' && navigator.serviceWorker.controller) {
             setWaitingWorker(sw);
         }
      });

      return () => {
        wb.removeEventListener('waiting', promptNewVersionAvailable);
      };
    }
  }, []);

  const reloadToUpdate = () => {
    if (waitingWorker) {
      setIsUpdating(true);
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Esperar a que el nuevo worker tome el control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
      // Fallback por si el evento no dispara
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-rio-ink text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700 flex items-center gap-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm">Nueva versión disponible</span>
          {!canUpdate && <span className="text-xs text-gray-300">Espera a que termine el envío...</span>}
        </div>
        <button 
          onClick={reloadToUpdate}
          disabled={!canUpdate || isUpdating}
          className="bg-rio-gold-dark hover:bg-rio-gold-light text-rio-ink disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
          {isUpdating ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
}
