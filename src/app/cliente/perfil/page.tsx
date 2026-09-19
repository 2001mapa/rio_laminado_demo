'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, MapPin, Phone, Mail, ChevronRight, LogOut, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const { currentCustomer, orders, resetDemoData } = useDemo();

  const customerOrders = orders.filter(o => o.customerId === currentCustomer?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleReset = () => {
    if (confirm('¿Restablecer tu sesión a su estado inicial?')) {
      resetDemoData();
      alert('Datos restablecidos');
      window.location.reload();
    }
  };

  if (!currentCustomer) {
    return <div className="p-8 text-center text-rio-muted font-medium">No has iniciado sesión</div>;
  }

  const ActionButtons = () => (
    <div className="space-y-3">
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center py-3.5 px-4 border border-rio-border rounded-xl text-sm font-semibold text-rio-ink bg-rio-surface hover:bg-rio-surface-muted transition-colors shadow-sm"
      >
        <RefreshCw className="w-4 h-4 mr-2 text-rio-muted" />
        Restablecer Datos Locales
      </button>
      <Link
        href="/api/auth/logout"
        className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-rio-danger bg-rio-danger/5 hover:bg-rio-danger/10 transition-colors"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar sesión
      </Link>
    </div>
  );

  return (
    <div className="p-4 pb-32 md:p-0 md:py-8">
      <div className="max-w-5xl mx-auto md:grid md:grid-cols-12 md:gap-8 md:items-start">
        
        {/* Left Column: Profile Card */}
        <div className="md:col-span-5 lg:col-span-4 space-y-6 mb-8 md:mb-0">
          <div className="bg-rio-surface p-6 md:p-8 rounded-3xl border border-rio-border shadow-sm text-center relative overflow-hidden md:sticky md:top-24">
            <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-rio-surface-muted border-b border-rio-border"></div>
            <div className="w-20 h-20 md:w-24 md:h-24 bg-rio-surface rounded-full flex items-center justify-center mx-auto mb-4 md:mb-5 text-3xl md:text-4xl font-serif text-rio-gold border border-rio-border relative z-10 shadow-sm">
              {currentCustomer.name.charAt(0)}
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-rio-ink leading-tight">{currentCustomer.name}</h1>
            <div className="mt-2.5 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rio-gold-light/20 text-rio-gold-dark border border-rio-gold-light/50">
              Mayorista ({currentCustomer.discount}% dcto)
            </div>
            
            <div className="mt-6 md:mt-8 flex flex-col space-y-3.5 text-[13px] text-left mx-auto">
              <div className="flex items-center text-rio-ink font-medium">
                <Mail className="w-4 h-4 mr-3 text-rio-muted" strokeWidth={1.5} />
                <span className="truncate">{currentCustomer.email}</span>
              </div>
              <div className="flex items-center text-rio-ink font-medium">
                <Phone className="w-4 h-4 mr-3 text-rio-muted" strokeWidth={1.5} />
                {currentCustomer.phone}
              </div>
              <div className="flex items-start text-rio-ink font-medium">
                <MapPin className="w-4 h-4 mr-3 text-rio-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="leading-snug">{currentCustomer.address}</span>
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
            <h2 className="text-xl md:text-2xl font-serif font-bold text-rio-ink">Historial de Reservas</h2>
            <span className="text-[12px] font-bold text-rio-muted uppercase tracking-wider">{customerOrders.length} pedidos</span>
          </div>
          
          <div className="space-y-3">
            {customerOrders.length > 0 ? (
              customerOrders.map(order => (
                <Link 
                  href={`/cliente/pedido/${order.id}`} 
                  key={order.id}
                  className="flex items-center justify-between p-4 md:p-5 bg-rio-surface rounded-2xl border border-rio-border shadow-sm active:scale-[0.98] md:hover:scale-[1.01] transition-all group hover:border-rio-gold/40 hover:shadow-md"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rio-background flex items-center justify-center mr-3.5 md:mr-4 shrink-0 border border-rio-border group-hover:bg-rio-gold/5 transition-colors">
                      <Package className="w-4 h-4 md:w-5 md:h-5 text-rio-gold-dark" />
                    </div>
                    <div>
                      <p className="text-[13px] md:text-sm font-bold text-rio-ink leading-none mb-1.5 md:mb-2">{order.number}</p>
                      <p className="text-[11px] md:text-[12px] font-medium text-rio-muted leading-none">
                        {new Date(order.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {!order.adjustmentAcknowledged && order.items.some(i => !!i.adjustmentReason) && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 md:px-2.5 py-0.5 md:py-1 rounded-md bg-rio-warning/10 text-rio-warning border border-rio-warning/20 mr-2 md:mr-3">
                        Ajustado
                      </span>
                    )}
                    <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 md:px-2.5 py-0.5 md:py-1 rounded-md border mr-2 md:mr-4 ${
                      order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' :
                      order.status === 'Cancelado' ? 'bg-rio-danger/10 text-rio-danger border-rio-danger/20' :
                      order.status === 'Verificado' || order.status === 'Despachado' || order.status === 'Empacado' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' :
                      order.status === 'En preparación' ? 'bg-rio-ink text-white border-transparent' :
                      'bg-rio-warning/10 text-rio-warning border-rio-warning/20'
                    }`}>
                      {order.status}
                    </span>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-rio-muted group-hover:text-rio-ink transition-colors" strokeWidth={1.5} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 bg-rio-surface rounded-2xl border border-rio-border border-dashed">
                <Package className="w-8 h-8 text-rio-muted/30 mx-auto mb-3" />
                <p className="text-[14px] text-rio-muted font-medium">No tienes reservas aún.</p>
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
