'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Info, X, XCircle } from 'lucide-react';

type Toast = { id: number; message: React.ReactNode; type: 'success' | 'info' | 'error' };

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type = 'info' } = (e as CustomEvent).detail;
      const id = ++nextId.current;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };
    window.addEventListener('rio:toast', handler);
    return () => window.removeEventListener('rio:toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-20 left-0 right-0 z-[110] flex flex-col items-center gap-2 px-4 md:bottom-6 print:hidden">
      {toasts.map(t => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-rio-border bg-rio-surface px-4 py-3 text-[13px] font-semibold text-rio-ink shadow-xl animate-slide-up"
        >
          {t.type === 'success' ? (
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rio-success">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          ) : t.type === 'error' ? (
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <XCircle className="w-5 h-5 text-rio-danger" strokeWidth={2} />
            </div>
          ) : (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-rio-gold-dark" />
          )}
          <span className="min-w-0 flex-1 leading-relaxed">{t.message}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="rounded-md p-0.5 text-rio-muted hover:text-rio-ink"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
