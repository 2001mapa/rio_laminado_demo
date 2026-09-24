'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, TrendingUp, Users } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { addToast } from '@/lib/toast';

export default function VendedorDashboard() {
  const { currentSeller, orders } = useDemo();

  const sellerOrders = orders.filter(o => o.sellerId === currentSeller?.id);
  const totalSales = sellerOrders.reduce((acc, order) => {
    return acc + ((order as any).totalAmount || 0);
  }, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-black text-rio-ink">
          ¡Hola, {currentSeller?.name.split(' ')[0] || 'Vendedor'}!
        </h1>
        <p className="text-rio-muted text-sm font-medium">Aquí está el resumen de tu gestión.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-rio-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-rio-gold-light/20 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rio-muted uppercase tracking-wider mb-1">Pedidos Generados</p>
            <p className="text-2xl font-black text-rio-ink leading-none">{sellerOrders.length}</p>
          </div>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-rio-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-rio-gold-light/20 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rio-muted uppercase tracking-wider mb-1">Ventas Estimadas</p>
            <p className="text-2xl font-black text-rio-ink leading-none">{formatPrice(totalSales)}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-rio-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-rio-gold-light/20 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rio-muted uppercase tracking-wider mb-1">Clientes Atendidos</p>
            <p className="text-2xl font-black text-rio-ink leading-none">
              {new Set(sellerOrders.map(o => o.customerId)).size}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-rio-ink">Tus pedidos recientes</h2>
          <button onClick={() => addToast('La vista de todos los pedidos está en construcción.')} className="text-xs font-bold text-rio-gold-dark hover:underline">Ver todos</button>
        </div>
        
        {sellerOrders.length === 0 ? (
          <div className="text-center py-10 bg-rio-surface-muted rounded-2xl border border-rio-border border-dashed">
            <Users className="w-8 h-8 text-rio-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-rio-muted">Aún no has registrado ventas hoy.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sellerOrders.slice(0, 5).map(order => (
              <div key={order.id} className="bg-white border border-rio-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-rio-ink text-sm">{order.number}</p>
                  <p className="text-xs text-rio-muted mt-0.5">{order.items.length} artículos</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-rio-surface-muted rounded-full text-[10px] font-bold text-rio-ink">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
