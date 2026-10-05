"use client";

import { useEffect, useState } from 'react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import { getOfflineSellerAccess } from '@/lib/offlineQueue';
import ToastContainer from '@/components/ToastContainer';
import { OfflineSellerContext } from '@/lib/OfflineSellerContext';

export default function OfflinePage() {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getOfflineSellerAccess()
      .then(access => setSellerId(access?.sellerId ?? null))
      .catch(() => setSellerId(null))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return <div className="min-h-screen bg-rio-background p-6">Preparando acceso sin conexión...</div>;
  if (sellerId) return (
    <>
      <div className="sticky top-0 z-50 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950">
        Sin conexión · Venta local. Stock y precio sujetos a confirmación al sincronizar.
      </div>
      <OfflineSellerContext.Provider value={sellerId}>
        <NuevaVentaPage />
      </OfflineSellerContext.Provider>
      <ToastContainer />
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-rio-background text-rio-ink p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-rio-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
        <h1 className="text-2xl font-serif font-bold mb-2">Estás sin conexión</h1>
        <p className="text-sm text-gray-600 mb-6">
          Para vender sin internet, entra una vez como vendedor con conexión y deja que termine la descarga del catálogo. El acceso local dura 48 horas y solo funciona en este dispositivo.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-rio-primary text-white font-semibold py-2 px-6 rounded-md hover:bg-rio-primary-dark transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
