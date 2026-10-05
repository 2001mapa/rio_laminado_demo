'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { registerConfirmHandler, type ConfirmRequest } from '@/lib/confirm';

export default function ConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const current = useRef<ConfirmRequest | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);

  useEffect(() => registerConfirmHandler(next => {
    current.current?.resolve(false);
    previousFocus.current = document.activeElement as HTMLElement | null;
    current.current = next;
    setRequest(next);
  }), []);

  useEffect(() => () => { current.current?.resolve(false); current.current = null; }, []);

  useEffect(() => {
    if (!request) return;
    cancelButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      }
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === cancelButton.current) {
          event.preventDefault();
          confirmButton.current?.focus();
        } else if (!event.shiftKey && document.activeElement === confirmButton.current) {
          event.preventDefault();
          cancelButton.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [request]);

  const finish = (accepted: boolean) => {
    const pending = current.current;
    current.current = null;
    setRequest(null);
    pending?.resolve(accepted);
    previousFocus.current?.focus();
  };

  if (!request) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-rio-ink/65 p-4 backdrop-blur-sm print:hidden">
      <div role="alertdialog" aria-modal="true" aria-labelledby="rio-confirm-title" aria-describedby="rio-confirm-description" className="w-full max-w-md rounded-2xl border border-rio-border bg-rio-surface p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${request.tone === 'danger' ? 'bg-rio-danger/10 text-rio-danger' : 'bg-rio-warning/10 text-rio-warning'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="rio-confirm-title" className="font-serif text-xl font-bold text-rio-ink">{request.title}</h2>
            <p id="rio-confirm-description" className="mt-2 text-sm leading-relaxed text-rio-muted">{request.description}</p>
          </div>
          <button type="button" tabIndex={-1} aria-label="Cerrar confirmación" onClick={() => finish(false)} className="rounded-lg p-1 text-rio-muted hover:bg-rio-surface-muted hover:text-rio-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelButton} type="button" onClick={() => finish(false)} className="min-h-11 rounded-xl border border-rio-border bg-white px-5 text-sm font-bold text-rio-ink hover:bg-rio-surface-muted">Volver</button>
          <button ref={confirmButton} type="button" onClick={() => finish(true)} className={`min-h-11 rounded-xl px-5 text-sm font-bold text-white ${request.tone === 'danger' ? 'bg-rio-danger hover:bg-rio-danger/90' : 'bg-rio-ink hover:bg-rio-ink/90'}`}>{request.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
