'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Key, PackageSearch, UserCheck, UserX } from 'lucide-react';
import { useDemo } from '@/lib/DemoContext';
import { getSellerProfileOrders, updateSeller } from '@/app/actions/sellers';
import SellerModal from '@/components/SellerModal';
import ResetSellerPasswordModal from '@/components/ResetSellerPasswordModal';
import { addToast } from '@/lib/toast';

type SellerOrder = {
  id: string;
  number: string;
  status: string;
  createdAt: Date;
  customerName: string;
  itemCount: number;
};

export default function AdminSellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { sellers, refreshData, onlineUsers, isLoaded } = useDemo();
  const seller = sellers.find(item => item.id === id);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [moreLoading, setMoreLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    setOrdersError('');
    getSellerProfileOrders(id).then(result => {
      if (!active) return;
      if (result.success) {
        setOrders(result.orders);
        setTotalOrders(result.total);
        setActiveOrders(result.active);
        setNextCursor(result.nextCursor);
      }
      else setOrdersError(result.message);
    }).catch(() => {
      if (active) setOrdersError('No se pudo cargar el historial de pedidos.');
    }).finally(() => {
      if (active) setOrdersLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  if (!seller) return (
    <div className="p-6 text-rio-muted">
      {isLoaded ? 'Vendedor no encontrado.' : 'Cargando vendedor...'}
    </div>
  );

  const isOnline = !!seller.authUserId && onlineUsers.includes(seller.authUserId);

  const handleLoadMore = async () => {
    if (!nextCursor || moreLoading) return;
    setMoreLoading(true);
    try {
      const result = await getSellerProfileOrders(id, nextCursor);
      if (result.success) {
        setOrders(previous => [...previous, ...result.orders]);
        setNextCursor(result.nextCursor);
        setTotalOrders(result.total);
        setActiveOrders(result.active);
      } else addToast(result.message);
    } catch {
      addToast('No se pudieron cargar más pedidos.');
    } finally {
      setMoreLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      const nextStatus = seller.status === 'active' ? 'suspended' : 'active';
      const result = await updateSeller(seller.id, { name: seller.name, email: seller.email, status: nextStatus });
      if (result.success) {
        await refreshData();
        addToast(nextStatus === 'active' ? 'Acceso activado.' : 'Acceso suspendido.');
      } else addToast(result.message || 'No se pudo cambiar el acceso.');
    } catch {
      addToast('No se pudo cambiar el acceso.');
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      <div className="flex items-center gap-3">
        <Link href="/admin/vendedores" aria-label="Volver a vendedores" className="text-rio-muted hover:text-rio-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-rio-ink">Perfil de Vendedor</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <section className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-16 bg-rio-surface-muted border-b border-rio-border" />
            <div className="relative inline-block mx-auto mb-4 z-10">
              <div className="w-20 h-20 bg-rio-surface rounded-full flex items-center justify-center text-3xl font-serif text-rio-gold-dark border border-rio-border shadow-sm">
                {seller.name.charAt(0)}
              </div>
              <span className={`absolute bottom-1 right-1 w-5 h-5 border-4 border-rio-surface rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} aria-label={isOnline ? 'En línea' : 'Desconectado'} />
            </div>
            <h2 className="text-xl font-bold text-rio-ink">{seller.name}</h2>
            <span className={`mt-3 inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${seller.status === 'active' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' : 'bg-rio-danger/10 text-rio-danger border-rio-danger/20'}`}>
              {seller.status === 'active' ? 'Acceso activo' : 'Acceso suspendido'}
            </span>
            <p className="mt-2 text-xs font-semibold text-rio-muted">{isOnline ? 'En línea' : 'Desconectado'}</p>
            <div className="mt-6 border-t border-rio-border pt-4 flex items-center justify-between text-sm">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rio-muted">Pedidos generados</span>
              <span className="font-black text-rio-ink text-base">{ordersLoading ? '…' : totalOrders}</span>
            </div>
          </section>

          <section className="bg-rio-surface p-5 rounded-2xl shadow-sm border border-rio-border space-y-2">
            <h3 className="text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-3">Acciones de acceso</h3>
            <button onClick={handleToggleStatus} disabled={statusBusy || !seller.authUserId} className="w-full flex items-center p-3 text-sm font-semibold rounded-xl border border-rio-border hover:bg-rio-surface-muted transition-colors text-rio-ink disabled:opacity-50">
              {seller.status === 'active' ? <UserX className="w-4 h-4 mr-3 text-rio-danger" /> : <UserCheck className="w-4 h-4 mr-3 text-rio-success" />}
              {seller.status === 'active' ? 'Suspender acceso' : 'Activar acceso'}
            </button>
            <button onClick={() => setResetOpen(true)} disabled={!seller.authUserId} className="w-full flex items-center p-3 text-sm font-semibold rounded-xl border border-rio-border hover:bg-rio-surface-muted transition-colors text-rio-ink disabled:opacity-50">
              <Key className="w-4 h-4 mr-3 text-rio-gold-dark" />
              Restablecer contraseña
            </button>
            {!seller.authUserId && <p className="text-xs text-rio-muted pt-2">Este perfil no tiene una cuenta de acceso vinculada.</p>}
          </section>
        </div>

        <div className="md:col-span-2 space-y-6">
          <section className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
            <div className="flex justify-between items-center mb-4 border-b border-rio-border pb-3">
              <h3 className="text-sm font-bold text-rio-ink uppercase tracking-wider">Datos del vendedor</h3>
              <button onClick={() => setEditOpen(true)} className="text-[11px] font-bold text-rio-gold-dark hover:text-rio-gold flex items-center uppercase tracking-wider">
                <Edit2 className="w-3 h-3 mr-1" /> Editar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Nombre</p><p className="font-medium text-rio-ink">{seller.name}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Correo electrónico</p><p className="font-medium text-rio-ink break-all">{seller.email}</p></div>
            </div>
          </section>

          <section className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-rio-ink uppercase tracking-wider">Historial de pedidos</h3>
              <div className="flex gap-4">
                <div className="text-center"><p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider">Activos</p><p className="font-bold text-lg text-rio-gold-dark leading-none mt-1">{activeOrders}</p></div>
                <div className="text-center border-l border-rio-border pl-4"><p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider">Total</p><p className="font-bold text-lg text-rio-ink leading-none mt-1">{totalOrders}</p></div>
              </div>
            </div>
            {ordersLoading ? <p className="text-sm text-rio-muted">Cargando pedidos...</p> : ordersError ? <p role="alert" className="text-sm text-rio-danger">{ordersError}</p> : orders.length === 0 ? (
              <div className="text-center py-8 bg-rio-background rounded-xl border border-rio-border border-dashed"><p className="text-sm font-medium text-rio-muted">Este vendedor todavía no tiene pedidos.</p></div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="flex items-center justify-between gap-3 p-3.5 bg-rio-background rounded-xl border border-rio-border hover:border-rio-gold/40 transition-colors group">
                    <div className="flex items-center min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-rio-surface flex items-center justify-center mr-3 shrink-0 border border-rio-border group-hover:bg-rio-gold-light/20 transition-colors"><PackageSearch className="w-4 h-4 text-rio-gold-dark" /></div>
                      <div className="min-w-0"><p className="text-[13px] font-bold text-rio-ink leading-none mb-1.5">{order.number}</p><p className="text-[11px] font-medium text-rio-muted truncate">{order.customerName} · {new Date(order.createdAt).toLocaleDateString('es-CO')} · {order.itemCount} refs</p></div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' : order.status === 'Cancelado' ? 'bg-rio-danger/10 text-rio-danger border-rio-danger/20' : 'bg-rio-success/10 text-rio-success border-rio-success/20'}`}>{order.status}</span>
                  </Link>
                ))}
                {nextCursor && <button onClick={handleLoadMore} disabled={moreLoading} className="w-full rounded-xl border border-rio-border bg-rio-surface-muted px-4 py-3 text-sm font-semibold text-rio-ink hover:bg-rio-border disabled:opacity-50">{moreLoading ? 'Cargando...' : 'Cargar más pedidos'}</button>}
              </div>
            )}
          </section>
        </div>
      </div>

      <SellerModal isOpen={editOpen} sellerToEdit={seller} onClose={() => setEditOpen(false)} onComplete={() => { setEditOpen(false); refreshData(); }} />
      <ResetSellerPasswordModal isOpen={resetOpen} sellerId={seller.id} sellerName={seller.name} onClose={() => setResetOpen(false)} />
    </div>
  );
}
