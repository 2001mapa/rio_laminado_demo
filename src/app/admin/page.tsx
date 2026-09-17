'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, BarChart2, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatCardSkeleton, OrderCardSkeleton } from '@/components/Skeletons';
import { formatPrice } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  'Reservado': 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light',
  'Confirmado': 'bg-rio-ink/10 text-rio-ink border-rio-ink/20',
  'En preparación': 'bg-rio-ink text-white border-transparent',
  'Pendiente de verificación': 'bg-rio-warning/10 text-rio-warning border-rio-warning/20',
  'Verificado': 'bg-rio-success/10 text-rio-success border-rio-success/20',
  'Empacado': 'bg-rio-success/10 text-rio-success border-rio-success/20',
  'Despachado': 'bg-rio-success/10 text-rio-success border-rio-success/20',
  'Cancelado': 'bg-rio-danger/10 text-rio-danger border-rio-danger/20',
};

export default function AdminDashboard() {
  const { orders, customers, products, isLoaded } = useDemo();
  const [orderView, setOrderView] = useState<'clientes' | 'vendedores'>('clientes');

  if (!isLoaded) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div className="h-8 w-64 bg-rio-border rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="bg-rio-surface rounded-xl border border-rio-border overflow-hidden">
          <div className="px-6 py-4 border-b border-rio-border">
            <div className="h-4 w-40 bg-rio-border rounded animate-pulse" />
          </div>
          <div className="divide-y divide-rio-border">
            {[1,2,3].map(i => (
              <div key={i} className="px-6 py-4">
                <OrderCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const newOrders = orders.filter(o => o.status === 'Reservado' || o.status === 'Confirmado').length;
  const inPrepOrders = orders.filter(o => o.status === 'En preparación').length;
  const pendingVerify = orders.filter(o => o.status === 'Pendiente de verificación').length;
  const verifiedOrders = orders.filter(o => o.status === 'Verificado' || o.status === 'Empacado').length;
  const totalOrders = orders.length;

  const urgentOrders = orders.filter(o =>
    o.status === 'Reservado' || o.status === 'Pendiente de verificación'
  );

  const displayedOrders = orders
    .filter(o => orderView === 'clientes' ? !o.sellerId : !!o.sellerId)
    .slice(0, 8);

  // --- DATA SCIENCE METRICS ---
  const productSales: Record<string, number> = {};
  let totalUnitsSold = 0;
  
  orders.forEach(order => {
    if (order.status !== 'Cancelado') {
      order.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        totalUnitsSold += item.quantity;
      });
    }
  });

  const validOrders = orders.filter(o => o.status !== 'Cancelado');
  const avgUnitsPerOrder = validOrders.length > 0 ? Math.round(totalUnitsSold / validOrders.length) : 0;

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return { ...p, qty };
    })
    .filter(p => p.sku); // ensure it exists

  const clientFrequency: Record<string, number> = {};
  validOrders.forEach(o => {
    if (o.customerId) {
      clientFrequency[o.customerId] = (clientFrequency[o.customerId] || 0) + 1;
    }
  });
  const topClients = Object.entries(clientFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, count]) => {
      const c = customers.find(cust => cust.id === id);
      return { ...c, orderCount: count };
    })
    .filter(c => c.name);

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-rio-muted uppercase tracking-[0.15em] mb-1">Panel de Control</p>
          <h1 className="text-3xl font-serif font-bold text-rio-ink">Resumen de Operación</h1>
        </div>
        <Link
          href="/admin/pedidos"
          className="hidden md:flex items-center gap-2 text-sm font-semibold text-rio-gold-dark hover:text-rio-gold transition-colors border border-rio-gold-light/50 px-4 py-2 rounded-xl hover:bg-rio-gold-light/10"
        >
          Ver todos los pedidos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Nuevos / Confirmados" value={newOrders} total={totalOrders} icon={Package} accent="gold" />
        <StatCard title="En Preparación" value={inPrepOrders} total={totalOrders} icon={Clock} accent="ink" />
        <StatCard title="Para Verificar" value={pendingVerify} total={totalOrders} icon={AlertTriangle} accent="warning" />
        <StatCard title="Verificados" value={verifiedOrders} total={totalOrders} icon={CheckCircle} accent="success" />
      </div>

      {/* Main 2-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Orders Table — takes 2/3 width */}
        <div className="lg:col-span-2 bg-rio-surface rounded-xl border border-rio-border overflow-hidden">
          <div className="px-6 py-4 border-b border-rio-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex bg-rio-background rounded-lg p-1">
              <button 
                onClick={() => setOrderView('clientes')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  orderView === 'clientes' 
                    ? 'bg-white text-rio-ink shadow-sm' 
                    : 'text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted'
                }`}
              >
                Clientes Directos
              </button>
              <button 
                onClick={() => setOrderView('vendedores')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  orderView === 'vendedores' 
                    ? 'bg-white text-rio-ink shadow-sm' 
                    : 'text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted'
                }`}
              >
                Por Vendedores
              </button>
            </div>
            <Link href="/admin/pedidos" className="text-xs font-bold text-rio-gold-dark hover:text-rio-gold transition-colors">
              Ver bandeja completa →
            </Link>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="bg-rio-background border-b border-rio-border">
                <th className="px-6 py-3 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider">Pedido</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-rio-muted uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rio-border">
              {displayedOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[12px] text-rio-muted font-medium">
                    No hay pedidos en esta categoría.
                  </td>
                </tr>
              )}
              {displayedOrders.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <tr key={order.id} className="hover:bg-rio-background transition-colors group">
                    <td className="px-6 py-3.5 whitespace-nowrap text-[13px] font-bold text-rio-ink">{order.number}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-[13px] text-rio-muted font-medium max-w-[160px] truncate">{customer?.name || '—'}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_CLASSES[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-[12px] text-rio-muted">{new Date(order.createdAt).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      <Link href={`/admin/pedidos/${order.id}`} className="text-[12px] font-bold text-rio-gold-dark opacity-0 group-hover:opacity-100 transition-opacity">
                        Gestionar →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right column — urgent + quick stats */}
        <div className="space-y-4">
          {/* Urgent */}
          <div className="bg-rio-surface rounded-xl border border-rio-border overflow-hidden">
            <div className="px-5 py-4 border-b border-rio-border flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rio-warning animate-pulse" />
              <h2 className="text-xs font-bold text-rio-ink uppercase tracking-wider">Requieren Atención</h2>
              <span className="ml-auto text-xs font-bold bg-rio-warning/10 text-rio-warning px-2 py-0.5 rounded-full">{urgentOrders.length}</span>
            </div>
            {urgentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-6 h-6 text-rio-success mx-auto mb-2 opacity-50" />
                <p className="text-xs text-rio-muted font-medium">Todo al día</p>
              </div>
            ) : (
              <div className="divide-y divide-rio-border">
                {urgentOrders.slice(0, 5).map(order => {
                  const customer = customers.find(c => c.id === order.customerId);
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/pedidos/${order.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-rio-background transition-colors group"
                    >
                      <div>
                        <p className="text-[13px] font-bold text-rio-ink leading-none">{order.number}</p>
                        <p className="text-[11px] text-rio-muted mt-0.5 truncate max-w-[130px]">{customer?.name}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-rio-muted group-hover:text-rio-gold-dark transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div className="bg-rio-surface rounded-xl border border-rio-border overflow-hidden divide-y divide-rio-border">
            {[
              { href: '/admin/inventario', label: 'Gestionar Inventario', icon: Package },
              { href: '/admin/clientes', label: 'Ver Clientes', icon: TrendingUp },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center justify-between px-5 py-4 hover:bg-rio-background transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rio-background border border-rio-border flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-rio-muted" strokeWidth={1.5} />
                  </div>
                  <span className="text-[13px] font-semibold text-rio-ink">{label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-rio-muted group-hover:text-rio-gold-dark transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* --- BUSINESS INTELLIGENCE SECTION --- */}
      <div className="pt-4">
        <h2 className="text-xl font-serif font-bold text-rio-ink mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-rio-gold-dark" /> Inteligencia de Negocio
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Products */}
          <div className="bg-rio-surface rounded-xl border border-rio-border overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-rio-border flex items-center gap-2 bg-rio-background">
              <Star className="w-4 h-4 text-rio-gold-dark" />
              <h3 className="text-sm font-bold text-rio-ink">Prendas Más Vendidas</h3>
            </div>
            <div className="p-5 flex-1 space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-rio-muted w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded bg-rio-background overflow-hidden border border-rio-border shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.sku} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-rio-muted">Img</div>
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-rio-ink leading-tight line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-rio-muted">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-rio-gold-dark">{p.qty} <span className="text-[10px] font-normal text-rio-muted">unds</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-rio-surface rounded-xl border border-rio-border overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-rio-border flex items-center gap-2 bg-rio-background">
              <Users className="w-4 h-4 text-rio-ink" />
              <h3 className="text-sm font-bold text-rio-ink">Clientes Frecuentes</h3>
            </div>
            <div className="p-5 flex-1 space-y-4">
              {topClients.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rio-ink/5 flex items-center justify-center text-xs font-serif font-bold text-rio-ink border border-rio-ink/10">
                      {c.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-rio-ink line-clamp-1">{c.name}</p>
                      <p className="text-[10px] text-rio-muted truncate max-w-[120px]">{c.address || c.email || 'Sin ubicación'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-rio-ink">{c.orderCount} <span className="text-[10px] font-normal text-rio-muted">pedidos</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics & Inventory Health */}
          <div className="bg-rio-surface rounded-xl border border-rio-border overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-rio-border flex items-center gap-2 bg-rio-background">
              <TrendingUp className="w-4 h-4 text-rio-success" />
              <h3 className="text-sm font-bold text-rio-ink">Salud del Negocio</h3>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center space-y-6">
              
              <div>
                <p className="text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1">Volumen por Pedido</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-rio-ink leading-none">{avgUnitsPerOrder}</span>
                  <span className="text-xs text-rio-muted font-medium mb-1">prendas / pedido</span>
                </div>
                <p className="text-[10px] text-rio-success font-medium mt-1">Métrica clave de rentabilidad B2B</p>
              </div>

              <div className="pt-4 border-t border-rio-border space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[12px] font-medium text-rio-ink">Referencias Agotadas</p>
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${outOfStockCount > 0 ? 'bg-rio-danger/10 text-rio-danger' : 'bg-rio-success/10 text-rio-success'}`}>
                    {outOfStockCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[12px] font-medium text-rio-ink">A punto de agotarse (&le;5)</p>
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${lowStockCount > 0 ? 'bg-rio-warning/10 text-rio-warning' : 'bg-rio-success/10 text-rio-success'}`}>
                    {lowStockCount}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile: link to full orders list */}
      <div className="lg:hidden">
        <Link
          href="/admin/pedidos"
          className="w-full flex items-center justify-between bg-rio-surface border border-rio-border rounded-xl px-5 py-4 hover:border-rio-gold/40 transition-colors"
        >
          <span className="text-sm font-bold text-rio-ink">Ver bandeja de pedidos</span>
          <ArrowRight className="w-4 h-4 text-rio-gold-dark" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, total, icon: Icon, accent }: {
  title: string; value: number; total: number; icon: any; accent: 'gold' | 'ink' | 'warning' | 'success';
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const accentClasses = {
    gold: { bar: 'bg-rio-gold', text: 'text-rio-gold-dark' },
    ink: { bar: 'bg-rio-ink', text: 'text-rio-ink' },
    warning: { bar: 'bg-rio-warning', text: 'text-rio-warning' },
    success: { bar: 'bg-rio-success', text: 'text-rio-success' },
  }[accent];

  return (
    <div className="bg-rio-surface p-5 rounded-xl border border-rio-border flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold text-rio-muted uppercase tracking-wider leading-tight max-w-[100px]">{title}</p>
        <Icon className={`w-4 h-4 shrink-0 ${accentClasses.text} opacity-60`} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-4xl font-serif font-bold text-rio-ink leading-none">{value}</p>
        <div className="mt-3 h-1 bg-rio-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${accentClasses.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-rio-muted mt-1 font-medium">{pct}% del total</p>
      </div>
    </div>
  );
}
