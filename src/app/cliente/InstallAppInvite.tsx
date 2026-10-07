'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallAppInvite({ customerId, pathname }: { customerId?: string; pathname: string }) {
  const installPrompt = useRef<InstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPrompt.current = event as InstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      installPrompt.current = null;
      setCanInstall(false);
      setShowInvite(false);
      if (customerId) {
        try { sessionStorage.removeItem(`rio:install-invite:${customerId}`); } catch { /* Storage may be disabled. */ }
      }
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;
    const timer = window.setTimeout(() => {
      let orderId: string | null = null;
      try { orderId = sessionStorage.getItem(`rio:install-invite:${customerId}`); } catch { /* Storage may be disabled. */ }
      const installed = window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setShowInvite(Boolean(orderId && pathname === `/cliente/pedido/${orderId}` && !installed));
      if (installed) {
        try { sessionStorage.removeItem(`rio:install-invite:${customerId}`); } catch { /* Storage may be disabled. */ }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [customerId, pathname]);

  if (!showInvite || !customerId) return null;

  const dismiss = () => {
    try { sessionStorage.removeItem(`rio:install-invite:${customerId}`); } catch { /* Storage may be disabled. */ }
    setShowInvite(false);
  };

  const install = async () => {
    const prompt = installPrompt.current;
    if (!prompt) return;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      installPrompt.current = null;
      setCanInstall(false);
      if (choice.outcome === 'accepted') dismiss();
    } catch {
      installPrompt.current = null;
      setCanInstall(false);
    }
  };

  return (
    <aside className="relative mt-4 rounded-2xl border border-rio-gold-light/60 bg-rio-surface p-4 pr-11 shadow-sm sm:p-5 sm:pr-12" aria-label="Instalar aplicación RIO">
      <button type="button" onClick={dismiss} aria-label="Cerrar invitación" className="absolute right-3 top-3 rounded-full p-1 text-rio-muted hover:bg-rio-surface-muted hover:text-rio-ink"><X className="h-4 w-4" /></button>
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-rio-gold-light/20 p-2 text-rio-gold-dark"><Download className="h-5 w-5" /></span>
        <div>
          <h2 className="text-sm font-bold text-rio-ink">¡Tu primer pedido está listo! Lleva RIO en tu teléfono</h2>
          <p className="mt-1 text-sm leading-relaxed text-rio-muted">Instala la app para abrir el catálogo y consultar tus pedidos más fácilmente.</p>
          {canInstall ? (
            <button type="button" onClick={install} className="mt-3 rounded-xl bg-rio-ink px-4 py-2 text-sm font-semibold text-white hover:bg-rio-ink/90">Instalar RIO</button>
          ) : (
            <p className="mt-2 text-xs text-rio-muted">{isIos ? 'En Safari, toca Compartir y luego «Agregar a inicio».' : 'Abre el menú de tu navegador y elige «Instalar aplicación» o «Agregar a pantalla de inicio».'}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
