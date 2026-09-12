'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, TrendingUp, Users } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function VendedorDashboard() {
  const { currentSeller, orders } = useDemo();

  const sellerOrders = orders.filter(o => o.sellerId === currentSeller?.id);
  const totalSales = sellerOrders.reduce((acc, order) => {
    // For simplicity, we assume an average item price of 60,000 COP for demo stats
    return acc + (order.items.length * 60000);
  }, 0);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-black text-rio-ink">
          ¡Hola, {currentSeller?.name.split(' ')[1] || 'Vendedor'}!
        </h1>
        <p className="text-rio-muted text-sm font-medium">Aquí está el resumen de tus ventas.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rio-surface-muted p-4 rounded-2xl border border-rio-border flex flex-col justify-between aspect-square">
          <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
            <Package className="w-4 h-4 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-3xl font-black text-rio-ink leading-none mb-1">{sellerOrders.length}</p>
            <p className="text-[11px] font-bold text-rio-muted uppercase tracking-wider">Pedidos Hoy</p>
          </div>
        </div>
        
        <div className="bg-rio-surface-muted p-4 rounded-2xl border border-rio-border flex flex-col justify-between aspect-square">
          <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
            <TrendingUp className="w-4 h-4 text-rio-gold-dark" />
          </div>
          <div>
            <p className="text-lg font-black text-rio-ink leading-tight mb-1">{formatPrice(totalSales)}</p>
            <p className="text-[11px] font-bold text-rio-muted uppercase tracking-wider">Ventas Est.</p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-rio-ink">Tus pedidos recientes</h2>
          <Link href="#" className="text-xs font-bold text-rio-gold-dark hover:underline">
            Ver todos
          </Link>
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
