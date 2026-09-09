import Link from 'next/link';
import { Building2, Store, Sparkles } from 'lucide-react';

export default function AccesoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rio-background p-4 font-sans">
      <div className="max-w-sm w-full space-y-8 text-center">

        {/* Logo */}
        <div>
          <div className="w-24 h-24 rounded-full border-[3px] border-rio-gold mx-auto flex items-center justify-center bg-rio-surface shadow-lg mb-5">
            <span className="font-serif font-black text-4xl text-rio-ink tracking-tighter">RIO</span>
          </div>
          <p className="text-[11px] text-rio-muted uppercase tracking-[0.2em] font-bold">Oro Laminado · B2B</p>
          <div className="mt-3 bg-rio-surface-muted text-rio-gold-dark text-[10px] font-bold px-3 py-1 rounded-full inline-flex items-center border border-rio-border gap-1.5">
            <Sparkles className="w-3 h-3" />
            Modo Demostración Interactiva
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <p className="text-[12px] text-rio-muted font-semibold uppercase tracking-wider">¿Desde qué perspectiva quieres explorar?</p>

          <Link
            href="/cliente"
            className="w-full flex items-start gap-4 py-5 px-5 border-2 border-rio-border rounded-2xl shadow-sm text-left bg-rio-surface hover:border-rio-gold/50 hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="w-11 h-11 rounded-xl bg-rio-surface-muted border border-rio-border flex items-center justify-center shrink-0 group-hover:bg-rio-gold/5 transition-colors">
              <Store className="w-5 h-5 text-rio-gold" />
            </div>
            <div>
              <p className="font-bold text-rio-ink text-[15px] leading-snug">Soy un Cliente Mayorista</p>
              <p className="text-[12px] text-rio-muted font-medium mt-1 leading-snug">Navega el catálogo, agrega productos y envía un pedido de reserva.</p>
            </div>
          </Link>

          <Link
            href="/admin"
            className="w-full flex items-start gap-4 py-5 px-5 border-2 border-transparent rounded-2xl shadow-sm text-left bg-rio-ink hover:bg-rio-ink/90 transition-all active:scale-[0.98] group"
          >
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-rio-gold-light" />
            </div>
            <div>
              <p className="font-bold text-white text-[15px] leading-snug">Soy el Administrador de Bodega</p>
              <p className="text-[12px] text-white/60 font-medium mt-1 leading-snug">Gestiona pedidos, prepara, verifica y despacha desde el panel interno.</p>
            </div>
          </Link>
        </div>

        <p className="text-[11px] text-rio-muted leading-relaxed">
          Todos los datos son ficticios. Esta demo es solo para ilustrar el flujo de trabajo B2B de RIO.
        </p>
      </div>
    </div>
  );
}
