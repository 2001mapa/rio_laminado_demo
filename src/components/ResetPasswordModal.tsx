'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle, Copy } from 'lucide-react';
import { resetCustomerPasswordAction } from '@/app/actions/clients';
import { Customer } from '@/lib/types';
import { addToast } from '@/lib/toast';

const generateSecurePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const array = new Uint32Array(10);
  window.crypto.getRandomValues(array);
  let pass = '';
  for (let i = 0; i < 10; i++) { pass += chars[array[i] % chars.length]; }
  return pass + 'A1a*';
};

export default function ResetPasswordModal({ 
  isOpen, 
  onClose,
  customer
}: { 
  isOpen: boolean; 
  onClose: () => void;
  customer: Customer;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState(() => generateSecurePassword());
  const [confirmed, setConfirmed] = useState(false);
  const [successPassword, setSuccessPassword] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatePassword = () => {
    setPassword(generateSecurePassword());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Debes confirmar que has verificado la identidad del cliente.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      const res = await resetCustomerPasswordAction(customer.id, password);
      
      if (!res.success) {
        setError(res.message);
      } else {
        setSuccessPassword(password);
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (!successPassword) return;
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${baseUrl}/login`;
    
    navigator.clipboard.writeText(
      `¡Hola ${customer.name}! Se ha restablecido tu acceso al catálogo mayorista de RIO. \n\n🔗 Ingresa aquí: ${inviteUrl}\n👤 Usuario: ${customer.username}\n🔑 Nueva contraseña: ${successPassword}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    if (successPassword) {
      // Clear state when closing after success
      setSuccessPassword('');
      setPassword(() => Math.random().toString(36).slice(-8).toUpperCase());
      setConfirmed(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-rio-surface rounded-2xl w-full max-w-lg shadow-2xl border border-rio-border flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted shrink-0">
          <h3 className="text-lg font-serif font-bold text-rio-ink">
            Restablecer Acceso
          </h3>
          <button type="button" onClick={handleClose} className="p-1 text-rio-muted hover:text-rio-ink transition-colors rounded-lg hover:bg-rio-border" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!successPassword ? (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6">
            {error && (
              <div className="p-3 bg-rio-danger/10 border border-rio-danger/20 text-rio-danger text-sm font-bold rounded-lg">
                {error}
              </div>
            )}

            <div className="bg-rio-warning/10 border border-rio-warning/20 rounded-xl p-3 text-xs text-rio-ink leading-relaxed">
              <strong>Atención:</strong> Vas a sobrescribir la contraseña actual de <strong>{customer.name}</strong>. Esta acción no se puede deshacer y el cliente perderá acceso con su contraseña anterior.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Nueva Contraseña *</label>
                <div className="flex gap-2">
                  <input name="newPassword" required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold font-mono" placeholder="Ej. RIO1234" minLength={6} />
                  <button type="button" onClick={generatePassword} className="px-3 py-2 bg-rio-surface-muted border border-rio-border rounded-xl text-xs font-bold text-rio-ink hover:bg-rio-border transition-colors">
                    Generar
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-4 pt-4 border-t border-rio-border">
                <input type="checkbox" id="confirm-identity" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 w-4 h-4 text-rio-gold-dark border-rio-border rounded focus:ring-rio-gold" />
                <label htmlFor="confirm-identity" className="text-sm text-rio-ink">
                  He verificado la identidad del cliente y confirmo que me ha solicitado restablecer su acceso.
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 pt-4 border-t border-rio-border">
              <button type="button" onClick={handleClose} disabled={isSubmitting} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting || !confirmed} className="flex-1 py-3 bg-rio-warning text-white rounded-xl text-sm font-bold hover:bg-rio-warning/90 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Restablecer Acceso'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-5">
            <CheckCircle className="w-16 h-16 text-rio-success mx-auto" />
            
            <div>
              <h4 className="text-xl font-bold text-rio-ink mb-1">Acceso Restablecido</h4>
              <p className="text-sm text-rio-muted">La nueva contraseña ya está activa.</p>
            </div>

            <div className="bg-rio-background border border-rio-border rounded-xl p-4 text-left">
              <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-2">Mensaje Listo para Enviar:</p>
              <p className="text-sm text-rio-ink font-serif italic mb-4 whitespace-pre-wrap">
                "¡Hola {customer.name}! Se ha restablecido tu acceso al catálogo mayorista de RIO. <br/><br/>
                🔗 Ingresa aquí: <span className="font-mono text-rio-gold-dark font-bold">{typeof window !== 'undefined' ? window.location.origin : ''}/login</span><br/>
                👤 Usuario: <span className="font-mono text-rio-gold-dark font-bold">{customer.username}</span><br/>
                🔑 Nueva contraseña: <span className="font-mono text-rio-gold-dark font-bold">{successPassword}</span>"
              </p>
              
              <div className="flex gap-2">
                {customer.phone && customer.phone.replace(/\D/g, '').length >= 10 ? (
                  <a 
                    href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${customer.name}! Se ha restablecido tu acceso al catálogo mayorista de RIO. \n\n🔗 Ingresa aquí: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\n👤 Usuario: ${customer.username}\n🔑 Nueva contraseña: ${successPassword}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-[13px] font-bold hover:bg-green-600 transition-colors flex justify-center items-center gap-2"
                  >
                    Enviar por WhatsApp
                  </a>
                ) : null}
                <button 
                  onClick={copyInviteLink}
                  className="flex-1 py-2.5 bg-rio-surface-muted border border-rio-border rounded-lg text-[13px] font-bold text-rio-ink hover:bg-rio-border transition-colors flex justify-center items-center gap-2"
                >
                  {copied ? '¡Copiado!' : 'Copiar Mensaje'}
                </button>
              </div>
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
