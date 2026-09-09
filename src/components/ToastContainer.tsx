'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

type Toast = { id: number; message: string };

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message } = (e as CustomEvent).detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2400);
    };
    window.addEventListener('rio:toast', handler);
    return () => window.removeEventListener('rio:toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 bg-rio-ink text-white text-[13px] font-semibold px-4 py-3 rounded-2xl shadow-xl animate-slide-up"
        >
          <div className="w-5 h-5 rounded-full bg-rio-success flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          {t.message}
        </div>
      ))}
    </div>
  );
}
