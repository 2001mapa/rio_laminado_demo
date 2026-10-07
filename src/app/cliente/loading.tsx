export default function ClienteLoading() {
  return (
    <div role="status" aria-label="Cargando sección del cliente" className="mx-auto w-full max-w-screen-xl p-4 pb-24 md:p-8">
      <span className="sr-only">Cargando sección del cliente…</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="mb-3 h-3 w-28 rounded-full bg-rio-gold-light/50" />
        <div className="mb-6 h-8 w-56 rounded-lg bg-rio-border/70" />
        <div className="mb-7 flex gap-3 overflow-hidden">
          <div className="h-24 w-56 shrink-0 rounded-2xl border border-rio-border bg-rio-surface-muted" />
          <div className="h-24 w-56 shrink-0 rounded-2xl border border-rio-border bg-rio-surface-muted" />
          <div className="h-24 w-56 shrink-0 rounded-2xl border border-rio-border bg-rio-surface-muted" />
        </div>
        <div className="mb-6 h-10 w-full rounded-xl bg-rio-border/60" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(item => <div key={item} className="h-64 rounded-2xl border border-rio-border bg-rio-surface-muted" />)}
        </div>
      </div>
    </div>
  );
}
