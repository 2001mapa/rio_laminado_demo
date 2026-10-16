'use client';

import { useState } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';

export default function MaintenancePage() {
  const [retrying, setRetrying] = useState(false);
  return (
    <main className="flex min-h-screen items-center justify-center bg-rio-background px-5 py-12 text-rio-ink">
      <div className="w-full max-w-lg rounded-3xl border border-rio-border bg-rio-surface px-7 py-10 text-center shadow-sm sm:px-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rio-gold-light/30 text-rio-gold-dark"><Wrench className="h-8 w-8" /></div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.25em] text-rio-gold-dark">RIO Oro Laminado</p>
        <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Volvemos en un momento</h1>
        <p className="mt-5 text-base leading-relaxed text-rio-muted">Estamos realizando una mejora para darte una mejor experiencia. Tus pedidos y tu información permanecen seguros.</p>
        <button type="button" disabled={retrying} onClick={() => { setRetrying(true); window.location.assign('/cliente'); }} className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rio-ink px-6 text-sm font-bold text-white hover:bg-rio-ink/90 disabled:opacity-60">
          <RefreshCw className="h-4 w-4" /> Intentar de nuevo
        </button>
        <p className="mt-6 text-xs text-rio-muted">Gracias por tu paciencia.</p>
      </div>
    </main>
  );
}
