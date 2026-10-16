'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, ExternalLink } from 'lucide-react';
import { setClientMaintenanceActive } from '@/app/actions/maintenance';
import { confirmRio } from '@/lib/confirm';

export default function MaintenanceControl({ initialActive }: { initialActive: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const toggle = async () => {
    const next = !active;
    const accepted = await confirmRio({
      title: next ? '¿Activar mantenimiento?' : '¿Reabrir el catálogo?',
      description: next
        ? 'Los clientes verán el aviso de mantenimiento y no podrán confirmar pedidos. Administradores y vendedores seguirán con acceso.'
        : 'Los clientes podrán volver a usar el catálogo y confirmar pedidos.',
      confirmLabel: next ? 'Activar mantenimiento' : 'Reabrir a clientes',
      tone: next ? 'warning' : undefined,
    });
    if (!accepted) return;
    setPending(true);
    setError('');
    try {
      const result = await setClientMaintenanceActive(next);
      setActive(result.active);
    } catch {
      setError('No se pudo cambiar el estado. Intenta nuevamente.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <div className="mb-7 flex items-center gap-3">
        <div className="rounded-xl bg-rio-gold-light/30 p-3 text-rio-gold-dark"><Wrench className="h-6 w-6" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-rio-muted">Administración</p>
          <h1 className="font-serif text-3xl font-bold text-rio-ink">Mantenimiento para clientes</h1>
        </div>
      </div>

      <section className="rounded-2xl border border-rio-border bg-rio-surface p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-rio-ink">Estado actual</h2>
            <p className="mt-1 text-sm text-rio-muted">{active ? 'El catálogo de clientes está en mantenimiento.' : 'Los clientes pueden usar el catálogo normalmente.'}</p>
          </div>
          <span role="status" className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'}`}>
            {active ? 'Mantenimiento activo' : 'Sitio disponible'}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={toggle} disabled={pending} className={`min-h-11 rounded-xl px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 ${active ? 'bg-rio-ink hover:bg-rio-ink/90' : 'bg-amber-700 hover:bg-amber-800'}`}>
            {pending ? 'Guardando…' : active ? 'Desactivar mantenimiento' : 'Activar mantenimiento'}
          </button>
          <Link href="/mantenimiento" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rio-border px-5 text-sm font-bold text-rio-ink hover:bg-rio-background">
            Ver aviso <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-medium text-rio-danger">{error}</p>}
      </section>

      <p className="mt-4 text-sm leading-relaxed text-rio-muted">Este cambio es manual y queda registrado en el historial. No afecta al panel administrativo ni a las ventas de vendedores. Los clientes con una pestaña abierta verán el aviso al navegar o, como máximo, tras la próxima comprobación periódica.</p>
    </main>
  );
}
