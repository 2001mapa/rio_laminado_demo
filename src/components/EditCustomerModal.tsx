'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { updateCustomerDataAction } from '@/app/actions/clients';
import { Customer } from '@/lib/types';
import { addToast } from '@/lib/toast';

export default function EditCustomerModal({ 
  isOpen, 
  onClose,
  customer,
  onComplete
}: { 
  isOpen: boolean; 
  onClose: () => void;
  customer: Customer;
  onComplete: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    try {
      const res = await updateCustomerDataAction(customer.id, customerData);
      
      if (!res.success) {
        setError(res.message);
      } else {
        addToast(res.message, 'success');
        onComplete();
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-rio-surface rounded-2xl w-full max-w-lg shadow-2xl border border-rio-border flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted shrink-0">
          <h3 className="text-lg font-serif font-bold text-rio-ink">
            Editar Cliente
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-rio-muted hover:text-rio-ink transition-colors rounded-lg hover:bg-rio-border" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-3 bg-rio-danger/10 border border-rio-danger/20 text-rio-danger text-sm font-bold rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Nombre de la Empresa o Cliente *</label>
              <input name="name" required type="text" defaultValue={customer.name} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">WhatsApp / Teléfono</label>
                <input name="phone" type="tel" defaultValue={customer.phone || ''} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" />
              </div>
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Correo (Opcional)</label>
                <input name="email" type="email" defaultValue={customer.email || ''} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Ciudad o Dirección (Opcional)</label>
              <input name="address" type="text" defaultValue={customer.address || ''} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" />
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t border-rio-border">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors flex justify-center items-center">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
