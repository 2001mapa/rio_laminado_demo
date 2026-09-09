'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { StatCardSkeleton, OrderCardSkeleton } from '@/components/Skeletons';

export default function AdminDashboard() {
  const { orders, customers, isLoaded } = useDemo();

  if (!isLoaded) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-10">
        <div className="h-7 w-56 bg-rio-border rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="bg-rio-surface rounded-2xl border border-rio-border overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-rio-border">
            <div className="h-4 w-40 bg-rio-border rounded animate-pulse" />
          </div>
          <div className="divide-y divide-rio-border">
            {[1,2,3].map(i => (
              <div key={i} className="px-5 py-4">
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

  const urgentOrders = orders.filter(o =>
    o.status === 'Reservado' || o.status === 'Pendiente de verificación'
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-serif font-bold text-rio-ink">Resumen de Operación</h1>
        <p className="text-[13px] text-rio-muted font-medium mt-1">Panel de gestión de bodega RIO · <span className="font-bold text-rio-gold-dark">Demo</span></p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Nuevos" value={newOrders} icon={Package} colorClass="text-rio-gold-dark" bgClass="bg-rio-gold-light/20" />
        <StatCard title="En preparación" value={inPrepOrders} icon={Clock} colorClass="text-purple-700" bgClass="bg-purple-50" />
        <StatCard title="Para verificar" value={pendingVerify} icon={AlertTriangle} colorClass="text-rio-warning" bgClass="bg-rio-warning/10" />
        <StatCard title="Verificados" value={verifiedOrders} icon={CheckCircle} colorClass="text-rio-success" bgClass="bg-rio-success/10" />
      </div>

      {/* Urgent attention */}
      {urgentOrders.length > 0 && (
        <div className="bg-rio-surface border border-rio-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-rio-border">
            <h2 className="text-[13px] font-bold text-rio-ink uppercase tracking-wider">Requieren Atención</h2>
          </div>
          <div className="divide-y divide-rio-border">
            {urgentOrders.map(order => {
              const customer = customers.find(c => c.id === order.customerId);
              return (
                <Link
                  key={order.id}
                  href={`/admin/pedidos/${order.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-rio-surface-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${order.status === 'Reservado' ? 'bg-rio-gold' : 'bg-rio-warning'}`} />
                    <div>
                      <p className="text-[13px] font-bold text-rio-ink">{order.number}</p>
                      <p className="text-[11px] text-rio-muted font-medium">{customer?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' :
                      'bg-rio-warning/10 text-rio-warning border-rio-warning/20'
                    }`}>
                      {order.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-rio-muted group-hover:text-rio-gold-dark transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All orders table — hidden on mobile, shown on md+ */}
      <div className="hidden md:block bg-rio-surface rounded-2xl shadow-sm border border-rio-border overflow-hidden">
        <div className="px-6 py-5 border-b border-rio-border flex justify-between items-center">
          <h2 className="text-sm font-bold text-rio-ink">Todos los Pedidos</h2>
          <Link href="/admin/pedidos" className="text-xs font-bold text-rio-gold-dark hover:text-rio-gold transition-colors">
            Ver bandeja completa
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-rio-border">
            <thead className="bg-rio-background">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Pedido</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-rio-muted uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-rio-surface divide-y divide-rio-border">
              {orders.slice(0, 5).map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <tr key={order.id} className="hover:bg-rio-surface-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-rio-ink">{order.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] text-rio-ink font-medium">{customer?.name || 'Desconocido'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' :
                        order.status === 'Confirmado' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        order.status === 'En preparación' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        order.status === 'Pendiente de verificación' ? 'bg-rio-warning/10 text-rio-warning border-rio-warning/20' :
                        order.status === 'Verificado' || order.status === 'Empacado' || order.status === 'Despachado' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' :
                        'bg-rio-danger/10 text-rio-danger border-rio-danger/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] text-rio-muted font-medium">
                      {new Date(order.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-bold">
                      <Link href={`/admin/pedidos/${order.id}`} className="text-rio-gold-dark hover:text-rio-gold transition-colors">
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: link to full orders list */}
      <div className="md:hidden">
        <Link
          href="/admin/pedidos"
          className="w-full flex items-center justify-between bg-rio-surface border border-rio-border rounded-2xl px-5 py-4 shadow-sm hover:border-rio-gold/40 transition-colors"
        >
          <span className="text-sm font-bold text-rio-ink">Ver bandeja de pedidos</span>
          <ArrowRight className="w-4 h-4 text-rio-gold-dark" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, colorClass, bgClass }: {
  title: string; value: number; icon: any; colorClass: string; bgClass: string;
}) {
  return (
    <div className="bg-rio-surface p-4 md:p-5 rounded-2xl border border-rio-border shadow-sm flex flex-col justify-between min-h-[100px]">
      <div className="flex justify-between items-start">
        <p className="text-[10px] md:text-[11px] font-bold text-rio-muted uppercase tracking-wider leading-tight">{title}</p>
        <div className={`p-2 rounded-xl ${bgClass} shrink-0`}>
          <Icon className={`w-4 h-4 ${colorClass}`} strokeWidth={2} />
        </div>
      </div>
      <p className="text-3xl font-serif font-bold text-rio-ink mt-3">{value}</p>
    </div>
  );
}
