'use client';

import { useDemo } from '@/lib/DemoContext';
import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { OrderCardSkeleton, OrderRowSkeleton } from '@/components/Skeletons';

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

export default function PedidosAdminPage() {
  const { orders, customers, sellers, isLoaded } = useDemo();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  if (!isLoaded) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5 pb-10">
        <div className="h-7 w-48 bg-rio-border rounded-lg animate-pulse" />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-rio-border rounded-xl animate-pulse" />
          <div className="h-10 w-48 bg-rio-border rounded-xl animate-pulse" />
        </div>
        {/* Mobile skeletons */}
        <div className="md:hidden space-y-3">
          {[1,2,3,4].map(i => <OrderCardSkeleton key={i} />)}
        </div>
        {/* Desktop skeleton table */}
        <div className="hidden md:block bg-rio-surface rounded-2xl border border-rio-border overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-rio-border">
            <thead className="bg-rio-background">
              <tr>
                {['Pedido','Cliente','Fecha','Estado','Líneas','Acción'].map(h => (
                  <th key={h} className="px-6 py-3"><div className="h-3 w-16 bg-rio-border rounded animate-pulse" /></th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-rio-surface divide-y divide-rio-border">
              {[1,2,3,4].map(i => <OrderRowSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    const customer = customers.find(c => c.id === order.customerId);
    const matchesSearch =
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-rio-muted uppercase tracking-[0.15em] mb-1">Gestión</p>
          <h1 className="text-3xl font-serif font-bold text-rio-ink">Bandeja de Pedidos</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-rio-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-rio-border rounded-xl text-sm bg-rio-surface placeholder-rio-muted focus:outline-none focus:ring-1 focus:ring-rio-gold focus:border-rio-gold text-rio-ink"
            placeholder="Buscar por pedido o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="pl-3 pr-8 py-2.5 border border-rio-border rounded-xl text-sm bg-rio-surface text-rio-ink focus:outline-none focus:ring-1 focus:ring-rio-gold focus:border-rio-gold appearance-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Reservado">Reservado</option>
          <option value="Confirmado">Confirmado</option>
          <option value="En preparación">En preparación</option>
          <option value="Pendiente de verificación">Pendiente de verificación</option>
          <option value="Verificado">Verificado</option>
          <option value="Despachado">Despachado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {filteredOrders.length > 0 ? filteredOrders.map(order => {
          const customer = customers.find(c => c.id === order.customerId);
          const seller = order.sellerId ? sellers.find(s => s.id === order.sellerId) : null;
          return (
            <Link
              key={order.id}
              href={`/admin/pedidos/${order.id}`}
              className="flex items-center justify-between bg-rio-surface p-4 rounded-2xl border border-rio-border shadow-sm hover:border-rio-gold/40 transition-colors group"
            >
              <div>
                <p className="text-[14px] font-bold text-rio-ink">{order.number}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[12px] text-rio-muted font-medium">{customer?.name}</p>
                  {seller && <span className="bg-rio-gold/10 text-rio-gold-dark px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">POS</span>}
                </div>
                <p className="text-[10px] text-rio-muted font-medium">{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
                <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[order.status] || ''}`}>
                  {order.status}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-rio-muted group-hover:text-rio-gold-dark transition-colors shrink-0 ml-3" />
            </Link>
          );
        }) : (
          <div className="text-center py-12 bg-rio-surface rounded-2xl border border-rio-border border-dashed">
            <p className="text-sm font-medium text-rio-muted">No se encontraron pedidos.</p>
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-rio-surface rounded-2xl shadow-sm border border-rio-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-rio-border">
            <thead className="bg-rio-background">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Pedido</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Líneas</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-rio-muted uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-rio-surface divide-y divide-rio-border">
              {filteredOrders.length > 0 ? filteredOrders.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                const seller = order.sellerId ? sellers.find(s => s.id === order.sellerId) : null;
                return (
                  <tr key={order.id} className="hover:bg-rio-surface-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-rio-ink">{order.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[13px] font-medium text-rio-ink">{customer?.name || 'Desconocido'}</div>
                      {seller ? (
                        <div className="text-[10px] text-rio-gold-dark font-bold">Vendedor: {seller.name}</div>
                      ) : (
                        <div className="text-[10px] text-rio-muted font-semibold">Cliente Web</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-rio-muted">{new Date(order.createdAt).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-rio-muted">{order.items.length} refs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-bold">
                      <Link href={`/admin/pedidos/${order.id}`} className="text-rio-gold-dark hover:text-rio-gold transition-colors">Gestionar</Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-rio-muted text-sm font-medium">No se encontraron pedidos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
