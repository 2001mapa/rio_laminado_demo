'use client';

import { useDemo } from '@/lib/DemoContext';
import { Package, MapPin, Phone, Mail, ChevronRight, LogOut, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const { currentCustomer, orders, resetDemoData } = useDemo();

  if (!currentCustomer) return null;

  const customerOrders = orders.filter(o => o.customerId === currentCustomer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleReset = () => {
    if (confirm('¿Restablecer todos los datos de demostración a su estado inicial?')) {
      resetDemoData();
      alert('Datos restablecidos');
    }
  };

  return (
    <div className="p-4 pb-32">
      <div className="bg-rio-surface p-6 rounded-3xl border border-rio-border shadow-sm text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-16 bg-rio-surface-muted border-b border-rio-border"></div>
        <div className="w-20 h-20 bg-rio-surface rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-serif text-rio-gold border border-rio-border relative z-10 shadow-sm">
          {currentCustomer.name.charAt(0)}
        </div>
        <h1 className="text-xl font-serif font-bold text-rio-ink">{currentCustomer.name}</h1>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rio-gold-light/20 text-rio-gold-dark border border-rio-gold-light/50">
          Mayorista ({currentCustomer.discount}% dcto)
        </div>
        
        <div className="mt-6 flex flex-col space-y-3 text-[13px] text-left max-w-xs mx-auto">
          <div className="flex items-center text-rio-ink font-medium">
            <Mail className="w-4 h-4 mr-3 text-rio-muted" strokeWidth={1.5} />
            {currentCustomer.email}
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

      <h2 className="text-lg font-serif font-bold text-rio-ink mb-4">Mis Reservas</h2>
      <div className="space-y-3 mb-10">
        {customerOrders.length > 0 ? (
          customerOrders.map(order => (
            <Link 
              href={`/cliente/pedido/${order.id}`} 
              key={order.id}
              className="flex items-center justify-between p-4 bg-rio-surface rounded-2xl border border-rio-border shadow-sm active:scale-[0.98] transition-transform group hover:border-rio-gold/40"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-rio-background flex items-center justify-center mr-3.5 shrink-0 border border-rio-border group-hover:bg-rio-gold/5 transition-colors">
                  <Package className="w-4 h-4 text-rio-gold-dark" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-rio-ink leading-none mb-1.5">{order.number}</p>
                  <p className="text-[11px] font-medium text-rio-muted leading-none">
                    {new Date(order.createdAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mr-3 ${
                  order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' :
                  order.status === 'Cancelado' ? 'bg-rio-danger/10 text-rio-danger border-rio-danger/20' :
                  order.status === 'Verificado' || order.status === 'Despachado' || order.status === 'Empacado' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' :
                  order.status === 'En preparación' ? 'bg-rio-ink text-white border-transparent' :
                  'bg-rio-warning/10 text-rio-warning border-rio-warning/20'
                }`}>
                  {order.status}
                </span>
                <ChevronRight className="w-4 h-4 text-rio-muted" strokeWidth={1.5} />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-6 bg-rio-surface rounded-2xl border border-rio-border border-dashed">
            <p className="text-[13px] text-rio-muted font-medium">No tienes reservas aún.</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center py-3.5 px-4 border border-rio-border rounded-xl text-sm font-semibold text-rio-ink bg-rio-surface hover:bg-rio-surface-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2 text-rio-muted" />
          Restablecer Datos de Demo
        </button>
        <Link
          href="/acceso-rio"
          className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-rio-danger bg-rio-danger/5 hover:bg-rio-danger/10 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Salir de la Demo
        </Link>
      </div>
    </div>
  );
}
