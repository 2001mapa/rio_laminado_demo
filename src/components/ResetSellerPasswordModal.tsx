'use client';

import { resetSellerPassword } from '@/app/actions/sellers';
import { X, Loader2, Key, Eye, EyeOff, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { validatePassword, generatePassword, PASSWORD_RULE_MESSAGE } from '@/lib/passwordPolicy';

type Step = 'form' | 'confirm' | 'done';

export default function ResetSellerPasswordModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
}: {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
}) {
  const [step, setStep] = useState<Step>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [auditWarning, setAuditWarning] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const clearSecrets = () => {
    setPassword('');
    setShowPassword(false);
    setError('');
    setAuditWarning('');
    setCopied(false);
    setStep('form');
  };

  useEffect(() => {
    if (isOpen) clearSecrets();
  }, [isOpen, sellerId]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    clearSecrets();
    onClose();
  };

  const handleGeneratePassword = () => {
    setPassword(generatePassword());
    setShowPassword(true);
  };

  const handleContinue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await resetSellerPassword(sellerId, password);
      if (!res.success) {
        setError(('message' in res && res.message) || 'No se pudo restablecer la contraseña.');
        setStep('form');
      } else {
        setAuditWarning(('auditWarning' in res && res.auditWarning) || '');
        setStep('done');
      }
    } catch {
      setError('Ocurrió un error inesperado. No se pudo confirmar el cambio de contraseña.');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-rio-surface rounded-2xl w-full max-w-lg shadow-2xl border border-rio-border flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted shrink-0">
          <h3 className="text-lg font-serif font-bold text-rio-ink">Restablecer contraseña</h3>
          <button onClick={handleClose} aria-label="Cerrar" className="p-1 text-rio-muted hover:text-rio-ink transition-colors rounded-lg hover:bg-rio-border" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleContinue} className="overflow-y-auto p-5 space-y-6">
            {error && (
              <div role="alert" className="p-3 bg-rio-danger/10 border border-rio-danger/20 text-rio-danger text-sm font-bold rounded-lg">
                {error}
              </div>
            )}

            <p className="text-sm text-rio-ink">
              Define la nueva contraseña para <strong>{sellerName}</strong>.
            </p>

            <div>
              <label htmlFor="reset-password" className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Nueva contraseña *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="reset-password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full border border-rio-border rounded-xl p-2.5 pr-10 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold"
                    placeholder="Escribe la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rio-muted hover:text-rio-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="button" onClick={handleGeneratePassword} className="px-3 py-2 border border-rio-border text-xs font-bold text-rio-ink rounded-xl hover:bg-rio-surface-muted">
                  Generar
                </button>
              </div>
              <p className="text-[11px] text-rio-muted mt-1.5">{PASSWORD_RULE_MESSAGE}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-rio-border">
              <button type="button" onClick={handleClose} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-3 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors">
                Continuar
              </button>
            </div>
          </form>
        )}

        {step === 'confirm' && (
          <div className="p-5 space-y-6">
            <div className="flex gap-3 bg-rio-danger/10 border border-rio-danger/30 rounded-xl p-4 text-sm text-rio-ink leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-rio-danger shrink-0 mt-0.5" />
              <p>
                La contraseña anterior de <strong>{sellerName}</strong> dejará de funcionar de inmediato.
                Tendrás que comunicarle la nueva clave para que pueda volver a iniciar sesión.
              </p>
            </div>
            <div className="flex gap-3 pt-4 border-t border-rio-border">
              <button type="button" onClick={() => setStep('form')} disabled={isSubmitting} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">
                Volver
              </button>
              <button type="button" onClick={handleConfirm} disabled={isSubmitting} className="flex-1 py-3 bg-rio-danger text-white rounded-xl text-sm font-bold hover:bg-rio-danger/90 transition-colors flex justify-center items-center">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sí, restablecer'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6 text-center space-y-5">
            <Key className="w-16 h-16 text-rio-success mx-auto" />
            <div>
              <h4 className="text-xl font-bold text-rio-ink mb-1">Contraseña restablecida</h4>
              <p className="text-sm text-rio-muted">El acceso de <strong>{sellerName}</strong> fue actualizado en Supabase Auth.</p>
            </div>

            {auditWarning && (
              <div role="alert" className="p-3 bg-rio-gold-light/10 border border-rio-gold-light text-rio-ink text-xs font-bold rounded-lg">
                {auditWarning}
              </div>
            )}

            <div className="bg-rio-background border border-rio-border rounded-xl p-4 text-left">
              <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-2">Nueva contraseña (se muestra solo ahora):</p>
              <p className="text-sm text-rio-ink font-mono p-3 bg-white border border-rio-border rounded-lg text-center break-all select-all">
                {password}
              </p>
              <button
                onClick={copyPassword}
                className="mt-3 w-full py-2.5 bg-rio-surface-muted border border-rio-border rounded-lg text-[13px] font-bold text-rio-ink hover:bg-rio-border transition-colors flex justify-center items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-rio-success" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiada!' : 'Copiar contraseña'}
              </button>
              <p className="text-xs text-rio-muted mt-3 text-center">Al cerrar esta ventana la contraseña se borra y no se volverá a mostrar.</p>
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
