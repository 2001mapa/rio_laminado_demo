'use client';
import { useEffect, useState } from 'react';
import { DownloadCloud } from 'lucide-react';
import { useDemo } from '@/lib/DemoContext';
import { getPendingOrders } from '@/lib/offlineQueue';

export default function PwaUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const { currentSeller } = useDemo(); // Para saber si estamos logueados o algo, pero no es estrictamente necesario
  
  const [canUpdate, setCanUpdate] = useState(false);

  useEffect(() => {
    // Revisar si es seguro actualizar: no debe haber envíos en curso
    // Como simplificación, habilitamos la actualización siempre que se renderice,
    // pero el componente se montará y el usuario decide hacer clic.
    // Para ser estrictos: "permite actualizar cuando su borrador esté guardado y no haya un envío en curso."
    // Vamos a consultar la cola local.
    const checkQueue = async () => {
       if (!currentSeller) { setCanUpdate(true); return; }
       const pending = await getPendingOrders(currentSeller.id);
       const isSyncing = pending.some(o => o.status === 'syncing');
       setCanUpdate(!isSyncing);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 2000);
    return () => clearInterval(interval);
  }, [currentSeller]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window as any).workbox) {
      const wb = (window as any).workbox;
      
      const promptNewVersionAvailable = (event: any) => {
        // Guardamos la referencia al SW esperando
        // En next-pwa, el SW esperando puede venir en el evento
        setWaitingWorker(wb.getSW ? wb.getSW() : event.sw);
      };

      wb.addEventListener('waiting', promptNewVersionAvailable);
      
      // Si ya hay uno esperando al arrancar
      wb.getSW().then((sw: ServiceWorker) => {
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
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-rio-ink text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700 flex items-center gap-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm">Nueva versión disponible</span>
          {!canUpdate && <span className="text-xs text-gray-300">Espera a que termine el envío actual...</span>}
        </div>
        <button 
          onClick={reloadToUpdate}
          disabled={!canUpdate}
          className="bg-rio-gold-dark hover:bg-rio-gold-light text-rio-ink disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
        >
          <DownloadCloud className="w-4 h-4" />
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}
