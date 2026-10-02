'use client';
import { useEffect, useState } from 'react';
import { DownloadCloud, Loader2 } from 'lucide-react';
import { getPendingOrders } from '@/lib/offlineQueue';
import { createClient } from '@/utils/supabase/client';

export default function PwaUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Monitor draft saving events
  useEffect(() => {
    const onSaving = () => setIsDraftSaving(true);
    const onSaved = () => setIsDraftSaving(false);
    
    window.addEventListener('draft-saving', onSaving);
    window.addEventListener('draft-saved', onSaved);
    
    return () => {
      window.removeEventListener('draft-saving', onSaving);
      window.removeEventListener('draft-saved', onSaved);
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
      
      // Also check if already waiting
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
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Solo recargar cuando el worker indique que ha tomado control. NO setTimeout ciego.
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  const canUpdate = !isSyncing && !isDraftSaving && !isUpdating;

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-rio-ink text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700 flex items-center gap-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm">Nueva versión disponible</span>
          {!canUpdate && !isUpdating && (
            <span className="text-xs text-gray-300">
              {isDraftSaving ? 'Guardando borrador...' : 'Espera a que termine el envío...'}
            </span>
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
