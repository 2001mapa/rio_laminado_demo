'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, Mail, LogOut, CheckCircle2, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { createClient } from '@/utils/supabase/client';
import { clearOfflineSellerAccess } from '@/lib/offlineQueue';

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO');

export default function VendedorPerfilPage() {
  const { currentSeller, orders, customers } = useDemo();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | 'day' | 'month'>('all');
  const [date, setDate] = useState('');

  if (!currentSeller) return null;

  const sellerOrders = orders.filter(o => o.sellerId === currentSeller.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const normalizedSearch = normalizeSearch(search.trim());
  const filteredOrders = sellerOrders.filter(order => {
    const customerName = order.customer?.name || customers.find(customer => customer.id === order.customerId)?.name || '';
    const matchesSearch = !normalizedSearch || normalizeSearch(`${order.number} ${customerName}`).includes(normalizedSearch);
    const orderDate = new Date(order.createdAt);
    const localDay = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
    const matchesDate = period === 'all' || !date || (period === 'day' ? localDay === date : localDay.slice(0, 7) === date);
    return matchesSearch && matchesDate;
  });

  const handleLogout = async () => {
    await clearOfflineSellerAccess().catch(() => {});
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        if (!key.includes('next-static') && !key.includes('google-fonts') && !key.includes('static-') && !key.includes('workbox')) {
          await caches.delete(key);
        }
      }
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const ActionButtons = () => (
    <div className="space-y-3">
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-rio-danger bg-rio-danger/10 hover:bg-rio-danger/20 transition-colors shadow-sm"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="p-4 pb-32 md:px-6 md:py-8">
      <div className="max-w-5xl mx-auto md:grid md:grid-cols-12 md:gap-8 md:items-start">
        
        {/* Left Column: Profile Card */}
        <div className="md:col-span-5 lg:col-span-4 space-y-6 mb-8 md:mb-0">
          <div className="bg-rio-surface p-6 md:p-8 rounded-3xl border border-rio-border shadow-sm text-center relative overflow-hidden md:sticky md:top-24">
            <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-rio-ink border-b border-rio-border"></div>
            <div className="w-20 h-20 md:w-24 md:h-24 bg-rio-surface rounded-full flex items-center justify-center mx-auto mb-4 md:mb-5 text-3xl md:text-4xl font-serif text-rio-ink border border-rio-border relative z-10 shadow-sm">
              {currentSeller.name.charAt(0)}
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-rio-ink leading-tight">{currentSeller.name}</h1>
            <div className={"mt-2.5 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border " + (
              currentSeller.status === 'active' 
                ? 'bg-rio-success/10 text-rio-success border-rio-success/20' 
                : 'bg-rio-danger/10 text-rio-danger border-rio-danger/20'
            )}>
              {currentSeller.status === 'active' ? 'Vendedor Activo' : 'Suspendido'}
            </div>
            
            <div className="mt-6 md:mt-8 flex flex-col space-y-3.5 text-sm text-left mx-auto">
              <div className="flex items-center text-rio-ink font-medium">
                <Mail className="w-4 h-4 mr-3 text-rio-muted" strokeWidth={1.5} />
                <span className="truncate">{currentSeller.email}</span>
              </div>
              <div className="flex items-center text-rio-ink font-medium">
                <CheckCircle2 className="w-4 h-4 mr-3 text-rio-muted" strokeWidth={1.5} />
                <span>{sellerOrders.length} ventas registradas</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons (Desktop) */}
          <div className="hidden md:block">
            <ActionButtons />
          </div>
        </div>

        {/* Right Column: Orders */}
        <div className="md:col-span-7 lg:col-span-8">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-rio-ink">Historial de ventas</h2>
            <span className="text-xs font-bold text-rio-muted uppercase tracking-wider">{sellerOrders.length} ventas</span>
          </div>
          <div className="mb-5 grid gap-3 rounded-2xl border border-rio-border bg-rio-surface p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="block min-w-0 text-xs font-bold text-rio-muted">
              Cliente o número de pedido
              <span className="relative mt-1.5 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar venta..." className="min-h-11 w-full rounded-xl border border-rio-border bg-white pl-9 pr-3 text-sm font-medium text-rio-ink focus:border-rio-gold-dark focus:outline-none" />
              </span>
            </label>
            <label className="block text-xs font-bold text-rio-muted">
              Filtrar por
              <select value={period} onChange={event => { setPeriod(event.target.value as 'all' | 'day' | 'month'); setDate(''); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-rio-border bg-white px-3 text-sm font-medium text-rio-ink focus:border-rio-gold-dark focus:outline-none">
                <option value="all">Todas las fechas</option>
                <option value="day">Día</option>
                <option value="month">Mes</option>
              </select>
            </label>
            {period !== 'all' && <label className="block text-xs font-bold text-rio-muted">
              {period === 'day' ? 'Seleccionar día' : 'Seleccionar mes'}
              <input type={period === 'day' ? 'date' : 'month'} value={date} onChange={event => setDate(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-rio-border bg-white px-3 text-sm font-medium text-rio-ink focus:border-rio-gold-dark focus:outline-none" />
            </label>}
          </div>
          <p className="mb-3 text-sm font-medium text-rio-muted">Mostrando {filteredOrders.length} de {sellerOrders.length} ventas</p>
          
          <div className="space-y-3">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <Link
                  key={order.id}
                  href={`/vendedor/pedido/${order.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-rio-surface rounded-2xl border border-rio-border shadow-sm transition-all group hover:border-rio-gold hover:shadow-md focus-visible:outline-2 focus-visible:outline-rio-gold-dark"
                >
                  <div className="flex items-center mb-3 sm:mb-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rio-background flex items-center justify-center mr-3.5 md:mr-4 shrink-0 border border-rio-border group-hover:bg-rio-gold/5 transition-colors">
                      <Package className="w-4 h-4 md:w-5 md:h-5 text-rio-ink" />
                    </div>
                    <div>
                      <p className="text-[13px] md:text-sm font-bold text-rio-ink leading-none mb-1.5 md:mb-2">{order.number}</p>
                      <p className="text-xs font-medium text-rio-muted leading-none">
                        {new Date(order.createdAt).toLocaleDateString('es-CO')}
                      </p>
                      <p className="mt-1.5 text-xs text-rio-muted">{order.customer?.name || customers.find(customer => customer.id === order.customerId)?.name || 'Cliente no disponible'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                    <div className="text-[13px] font-bold text-rio-ink mr-4">
                      {order.items.length} referencias
                    </div>
                    <span className={"text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border " + (
                      order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' :
                      order.status === 'Cancelado' ? 'bg-rio-danger/10 text-rio-danger border-rio-danger/20' :
                      order.status === 'Verificado' || order.status === 'Despachado' || order.status === 'Empacado' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' :
                      order.status === 'En preparación' ? 'bg-rio-ink text-white border-transparent' :
                      'bg-rio-warning/10 text-rio-warning border-rio-warning/20'
                    )}>
                      {order.status}
                    </span>
                    <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-rio-muted" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 bg-rio-surface rounded-2xl border border-rio-border border-dashed">
                <Package className="w-8 h-8 text-rio-muted/30 mx-auto mb-3" />
                <p className="text-sm text-rio-muted font-medium">{sellerOrders.length === 0 ? 'No has registrado ventas aún.' : 'No hay ventas que coincidan con los filtros.'}</p>
              </div>
            )}
          </div>

          {/* Action buttons (Mobile) */}
          <div className="md:hidden mt-8">
            <ActionButtons />
          </div>
        </div>

      </div>
    </div>
  );
}
