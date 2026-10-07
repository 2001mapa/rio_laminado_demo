export default function VendedorLoading() {
  return (
    <div role="status" aria-label="Cargando módulo del vendedor" className="mx-auto w-full max-w-6xl p-4 pb-24 md:p-8">
      <span className="sr-only">Cargando módulo del vendedor…</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="mb-3 h-3 w-24 rounded-full bg-rio-gold-light/50" />
        <div className="mb-7 h-8 w-48 rounded-lg bg-rio-border/70" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-2xl border border-rio-border bg-rio-surface-muted" />
          <div className="h-28 rounded-2xl border border-rio-border bg-rio-surface-muted" />
          <div className="h-28 rounded-2xl border border-rio-border bg-rio-surface-muted" />
        </div>
        <div className="mt-6 h-48 rounded-2xl border border-rio-border bg-rio-surface-muted" />
      </div>
    </div>
  );
}
