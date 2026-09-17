'use client';

import { useState } from 'react';
import { X, Loader2, Link as LinkIcon, CheckCircle, Copy } from 'lucide-react';
import { createCustomer } from '@/app/actions/clients';
import { useDemo } from '@/lib/DemoContext';

export default function CreateCustomerModal({ 
  isOpen, 
  onClose,
  onComplete
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onComplete: () => void;
}) {
  const { addCustomer } = useDemo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      discount: parseInt(formData.get('discount') as string, 10) || 0,
      showDiscount: formData.get('showDiscount') === 'true',
    };

    try {
      const res = await createCustomer(customerData);
      
      if (!res.success) {
        setError(res.message);
      } else {
        setSuccessData(res.customer);
        if (res.customer) {
          addCustomer({
            id: res.customer.id,
            name: res.customer.name,
            email: res.customer.email || '',
            phone: res.customer.phone || '',
            address: res.customer.address || '',
            discount: res.customer.discount,
            showDiscount: res.customer.showDiscount,
            status: res.customer.status as 'active' | 'suspended'
          });
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (!successData) return;
    
    // En producción esto debería ser el dominio real (ej. https://riob2b.com)
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/acceso-rio?token=${successData.id}`;
    
    navigator.clipboard.writeText(
      `¡Hola ${successData.name}! Aquí tienes tu acceso exclusivo al catálogo mayorista de RIO. \n\nIngresa aquí: ${inviteUrl}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    if (successData) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-rio-surface rounded-2xl w-full max-w-lg shadow-2xl border border-rio-border flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted shrink-0">
          <h3 className="text-lg font-serif font-bold text-rio-ink">
            {successData ? '¡Cliente Registrado!' : 'Nuevo Cliente Mayorista'}
          </h3>
          <button onClick={handleClose} className="p-1 text-rio-muted hover:text-rio-ink transition-colors rounded-lg hover:bg-rio-border" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!successData ? (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6">
            {error && (
              <div className="p-3 bg-rio-danger/10 border border-rio-danger/20 text-rio-danger text-sm font-bold rounded-lg">
                {error}
              </div>
            )}

            <div className="bg-rio-gold-light/10 border border-rio-gold-light rounded-xl p-3 text-xs text-rio-ink leading-relaxed">
              <strong>Lógica por Invitación:</strong> Los clientes no se registran solos. Al crear este perfil, el sistema generará un <strong>Enlace Mágico único</strong> que le enviarás por WhatsApp para que ingrese directamente con su descuento aplicado.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Nombre de la Empresa o Cliente *</label>
                <input name="name" required type="text" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="Joyería El Diamante" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">WhatsApp / Teléfono</label>
                  <input name="phone" type="tel" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="300 000 0000" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Correo (Opcional)</label>
                  <input name="email" type="email" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="cliente@correo.com" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Ciudad o Dirección (Opcional)</label>
                <input name="address" type="text" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="Bogotá, Colombia" />
              </div>
            </div>

            <div className="pt-4 border-t border-rio-border space-y-4">
              <h4 className="text-xs uppercase font-bold text-rio-muted tracking-wider">Reglas Comerciales</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">% Descuento Mayorista *</label>
                  <div className="relative">
                    <input name="discount" required type="number" min="0" max="100" defaultValue="0" className="w-full border border-rio-border rounded-xl p-2.5 pr-8 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold font-mono" />
                    <span className="absolute right-3 top-2.5 font-bold text-rio-muted">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Mostrar descuento</label>
                  <select name="showDiscount" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold">
                    <option value="false">Solo mostrar Precio Final</option>
                    <option value="true">Mostrar Precio Original Tachado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 pt-4 border-t border-rio-border">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors flex justify-center items-center">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar y Generar Invitación'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-5">
            <CheckCircle className="w-16 h-16 text-rio-success mx-auto" />
            
            <div>
              <h4 className="text-xl font-bold text-rio-ink mb-1">{successData.name}</h4>
              <p className="text-sm text-rio-muted">El perfil ha sido creado con éxito. Ya puedes compartirle su acceso único.</p>
            </div>

            <div className="bg-rio-background border border-rio-border rounded-xl p-4 text-left">
              <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-2">Mensaje Listo para Enviar:</p>
              <p className="text-sm text-rio-ink font-serif italic mb-4">
                "¡Hola {successData.name}! Aquí tienes tu acceso exclusivo al catálogo mayorista de RIO. Ingresa aquí: <br/><br/>
                <span className="font-mono text-rio-gold-dark text-xs break-all">{window.location.origin}/acceso-rio?token={successData.id}</span>"
              </p>
              <button 
                onClick={copyInviteLink}
                className="w-full py-2.5 bg-rio-surface-muted border border-rio-border rounded-lg text-[13px] font-bold text-rio-ink hover:bg-rio-border transition-colors flex justify-center items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-rio-success" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Mensaje Copiado!' : 'Copiar Mensaje para WhatsApp'}
              </button>
            </div>

            <button onClick={handleClose} className="w-full py-3 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
