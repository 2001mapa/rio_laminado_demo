'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
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
  const { orders, customers, isLoaded } = useDemo();

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
  const recentOrders = orders.slice(0, 8);

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
          <div className="px-6 py-4 border-b border-rio-border flex justify-between items-center">
            <h2 className="text-sm font-bold text-rio-ink uppercase tracking-wider">Todos los Pedidos</h2>
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
              {recentOrders.map(order => {
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
