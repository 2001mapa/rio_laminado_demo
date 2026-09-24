'use client';

import { useDemo } from '@/lib/DemoContext';
import { updateCustomerStatusAction } from '@/app/actions/clients';
import EditCustomerModal from '@/components/EditCustomerModal';
import { useState } from 'react';
import { addToast } from '@/lib/toast';
import { ArrowLeft, Edit2, Mail, ShieldAlert, Key, UserCheck, UserX, PackageSearch, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';

export default function ClienteDetalleAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { customers, orders, updateCustomer, refreshData } = useDemo();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const customer = customers.find(c => c.id === resolvedParams.id);

  if (!customer) return <div className="p-4 text-rio-muted">Cliente no encontrado</div>;

  
  const handleToggleStatus = async () => {
    try {
      const newStatus = customer.status === 'active' ? 'suspended' : 'active';
      const res = await updateCustomerStatusAction(customer.id, { status: newStatus });
      if (res.success) {
        addToast(res.message);
        refreshData();
      } else {
        addToast(res.message);
      }
    } catch (e) {
      addToast('Error al cambiar estado');
    }
  };

  const customerOrders = orders.filter(o => o.customerId === customer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeOrders = customerOrders.filter(o => !['Cancelado', 'Despachado'].includes(o.status));
  const totalOrders = customerOrders.length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-rio-muted hover:text-rio-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-serif font-bold text-rio-ink">Perfil de Cliente</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Main Info Card */}
          <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-16 bg-rio-surface-muted border-b border-rio-border"></div>
            <div className="w-20 h-20 bg-rio-surface rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-serif text-rio-gold-dark border border-rio-border relative z-10 shadow-sm">
              {customer.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-rio-ink">{customer.name}</h2>
            
            <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-rio-success/10 text-rio-success border-rio-success/20">
              {customer.status === 'active' ? 'Acceso Activo' : 'Acceso Suspendido'}
            </div>

            <div className="mt-6 border-t border-rio-border pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-rio-muted font-bold uppercase tracking-wider text-[10px]">Descuento B2B</span>
                <span className="font-black text-rio-ink text-base">{customer.discount}%</span>
              </div>
              <button onClick={() => addToast('La edición de descuentos requiere un modal de confirmación. Pendiente de implementación.')} className="w-full py-2 text-[12px] font-bold text-rio-gold-dark bg-rio-gold-light/20 hover:bg-rio-gold-light/40 border border-rio-gold-light rounded-lg transition-colors flex justify-center items-center">
                <Edit2 className="w-3 h-3 mr-2" />
                Editar Descuento
              </button>

              {/* Visibility toggle */}
              <button
                onClick={() => updateCustomer({ ...customer, showDiscount: !customer.showDiscount })}
                className={`w-full py-2.5 text-[12px] font-bold rounded-lg transition-colors flex justify-center items-center gap-2 border ${
                  customer.showDiscount
                    ? 'bg-rio-success/10 text-rio-success border-rio-success/20 hover:bg-rio-success/20'
                    : 'bg-rio-surface-muted text-rio-muted border-rio-border hover:bg-rio-border'
                }`}
              >
                {customer.showDiscount
                  ? <><Eye className="w-3.5 h-3.5" /> Cliente ve su descuento</>
                  : <><EyeOff className="w-3.5 h-3.5" /> Descuento oculto al cliente</>
                }
              </button>
              <p className="text-[10px] text-rio-muted leading-relaxed text-center font-medium">
                {customer.showDiscount
                  ? 'El cliente puede ver su % de descuento en el catálogo.'
                  : 'El cliente no verá su descuento. Solo tú lo gestionas.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-rio-surface p-5 rounded-2xl shadow-sm border border-rio-border space-y-2">
            <h3 className="text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-3">Acciones de Acceso</h3>
            
            <button onClick={handleToggleStatus} className="w-full flex items-center p-3 text-sm font-semibold rounded-xl border border-rio-border hover:bg-rio-surface-muted transition-colors text-rio-ink">
              {customer.status === 'active' ? <UserX className="w-4 h-4 mr-3 text-rio-danger" /> : <UserCheck className="w-4 h-4 mr-3 text-rio-success" />}
              {customer.status === 'active' ? 'Suspender Acceso' : 'Activar Acceso'}
            </button>
            
            <button onClick={() => addToast('La infraestructura de envío de correos no está configurada.')} className="w-full flex items-center p-3 text-sm font-semibold rounded-xl border border-rio-border hover:bg-rio-surface-muted transition-colors text-rio-ink">
              <Mail className="w-4 h-4 mr-3 text-rio-gold-dark" />
              Reenviar Invitación
            </button>
            
            <button onClick={() => addToast('El restablecimiento de credenciales requiere configuración de Supabase Auth.')} className="w-full flex items-center p-3 text-sm font-semibold rounded-xl border border-rio-border hover:bg-rio-surface-muted transition-colors text-rio-ink">
              <Key className="w-4 h-4 mr-3 text-rio-warning" />
              Restablecer Acceso
            </button>

            <button onClick={() => addToast('La infraestructura de notificaciones no está configurada.')} className="w-full flex items-center p-3 text-sm font-semibold rounded-xl border border-rio-border hover:bg-rio-surface-muted transition-colors text-rio-ink">
              <ShieldAlert className="w-4 h-4 mr-3 text-rio-muted" />
              Verificar Documentación
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Contact & Shipping Data */}
          <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
            <div className="flex justify-between items-center mb-4 border-b border-rio-border pb-3">
              <h3 className="text-sm font-bold text-rio-ink uppercase tracking-wider">Datos de Contacto y Envío</h3>
              <button onClick={() => setIsEditModalOpen(true)} className="text-[11px] font-bold text-rio-gold-dark hover:text-rio-gold flex items-center uppercase tracking-wider">
                <Edit2 className="w-3 h-3 mr-1" /> Editar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Correo Electrónico</p>
                <p className="font-medium text-rio-ink">{customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Teléfono</p>
                <p className="font-medium text-rio-ink">{customer.phone}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Ciudad</p>
                <p className="font-medium text-rio-ink">No registrada</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Dirección de Envío</p>
                <p className="font-medium text-rio-ink">{customer.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-rio-border">
              <div>
                <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Fecha de Creación</p>
                <p className="font-medium text-rio-ink">{((customer as any).createdAt) ? new Date((customer as any).createdAt).toLocaleDateString('es-CO') : 'No registrada'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Último Acceso</p>
                <p className="font-medium text-rio-ink">Desconocido</p>
              </div>
            </div>
          </div>

          {/* Orders History */}
          <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-rio-ink uppercase tracking-wider">Historial de Pedidos</h3>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider">Activos</p>
                  <p className="font-bold text-lg text-rio-gold-dark leading-none mt-1">{activeOrders.length}</p>
                </div>
                <div className="text-center border-l border-rio-border pl-4">
                  <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider">Total</p>
                  <p className="font-bold text-lg text-rio-ink leading-none mt-1">{totalOrders}</p>
                </div>
              </div>
            </div>

            {customerOrders.length > 0 ? (
              <div className="space-y-3">
                {customerOrders.map(order => (
                  <Link 
                    key={order.id}
                    href={`/admin/pedidos/${order.id}`}
                    className="flex items-center justify-between p-3.5 bg-rio-background rounded-xl border border-rio-border hover:border-rio-gold/40 transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-rio-surface flex items-center justify-center mr-3 shrink-0 border border-rio-border group-hover:bg-rio-gold-light/20 transition-colors">
                        <PackageSearch className="w-4 h-4 text-rio-gold-dark" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-rio-ink leading-none mb-1.5">{order.number}</p>
                        <p className="text-[11px] font-medium text-rio-muted leading-none">
                          {new Date(order.createdAt).toLocaleDateString('es-CO')} • {order.items.length} refs
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                      order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' :
                      order.status === 'Confirmado' ? 'bg-rio-ink/10 text-rio-ink border-rio-ink/20' :
                      order.status === 'En preparación' ? 'bg-rio-ink text-white border-transparent' :
                      order.status === 'Pendiente de verificación' ? 'bg-rio-warning/10 text-rio-warning border-rio-warning/20' :
                      order.status === 'Verificado' || order.status === 'Empacado' || order.status === 'Despachado' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' :
                      'bg-rio-danger/10 text-rio-danger border-rio-danger/20'
                    }`}>
                      {order.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-rio-background rounded-xl border border-rio-border border-dashed">
                <p className="text-sm font-medium text-rio-muted">Este cliente no ha realizado pedidos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {customer && <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={customer}
        onComplete={() => {
          setIsEditModalOpen(false);
          refreshData();
        }}
      />}
    </div>
  );
}
