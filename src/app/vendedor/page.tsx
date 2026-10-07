'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, Users, Hash, Layers, ChevronRight, ScanLine } from 'lucide-react';
import Link from 'next/link';

export default function VendedorDashboard() {
  const { currentSeller, orders } = useDemo();

  const sellerOrders = orders.filter(o => o.sellerId === currentSeller?.id);
  const totalReferences = sellerOrders.reduce((acc, order) => acc + order.items.length, 0);
  
  const totalUnits = sellerOrders.reduce((acc, order) => {
    return acc + order.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-rio-muted">Punto de venta</p>
        <h1 className="text-2xl font-serif font-black text-rio-ink">
          ¡Hola, {currentSeller?.name.split(' ')[0] || 'Vendedor'}!
        </h1>
        <p className="text-rio-muted text-sm font-medium">Tu actividad de ventas, de un vistazo.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {/* Card 1 */}
        <div className="col-span-2 md:col-span-1 bg-white p-5 rounded-2xl border border-rio-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-rio-gold-light/20 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-xs font-bold text-rio-muted uppercase tracking-wider mb-1">Pedidos Generados</p>
            <p className="text-2xl font-black text-rio-ink leading-none">{sellerOrders.length}</p>
          </div>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-rio-border shadow-sm flex items-center gap-3 md:gap-4 hover:shadow-md transition-shadow">
          <div className="bg-rio-gold-light/20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0">
            <Hash className="w-5 h-5 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-xs font-bold text-rio-muted uppercase tracking-wider mb-1">Referencias</p>
            <p className="text-2xl font-black text-rio-ink leading-none">{totalReferences}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-rio-border shadow-sm flex items-center gap-3 md:gap-4 hover:shadow-md transition-shadow">
          <div className="bg-rio-gold-light/20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-xs font-bold text-rio-muted uppercase tracking-wider mb-1">Unidades</p>
            <p className="text-2xl font-black text-rio-ink leading-none">{totalUnits}</p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-rio-ink">Pedidos recientes</h2>
          <Link href="/vendedor/perfil" className="min-h-11 inline-flex items-center text-sm font-bold text-rio-gold-dark hover:underline">Ver historial</Link>
        </div>
        
        {sellerOrders.length === 0 ? (
          <div className="text-center py-10 bg-rio-surface-muted rounded-2xl border border-rio-border border-dashed">
            <Users className="w-8 h-8 text-rio-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-rio-muted">Aún no has registrado ventas.</p>
            <Link href="/vendedor/nueva-venta" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rio-ink px-4 text-sm font-bold text-white"><ScanLine className="h-4 w-4" /> Nueva venta</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {[...sellerOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(order => (
              <Link key={order.id} href={`/vendedor/pedido/${order.id}`} className="bg-white border border-rio-border p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-rio-gold focus-visible:outline-2 focus-visible:outline-rio-gold-dark">
                <div>
                  <p className="font-bold text-rio-ink text-sm">{order.number}</p>
                  <p className="text-xs text-rio-muted mt-0.5">{order.customer?.name || 'Cliente'} · {order.items.length} referencias</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="inline-block px-2.5 py-1 bg-rio-surface-muted rounded-full text-xs font-bold text-rio-ink">
                    {order.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-rio-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
