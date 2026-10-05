'use client';

import { useDemo } from '@/lib/DemoContext';
import { createSeller, updateSeller } from '@/app/actions/sellers';
import { X, Loader2, Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Seller } from '@/lib/types';
import { validatePassword, generatePassword, PASSWORD_RULE_MESSAGE } from '@/lib/passwordPolicy';

export default function SellerModal({ 
  isOpen, 
  onClose,
  onComplete,
  sellerToEdit 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onComplete: () => void;
  sellerToEdit: Seller | null;
}) {
  const { addSeller } = useDemo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<Seller & { tempPassword?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('active');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (sellerToEdit) {
        setName(sellerToEdit.name);
        setEmail(sellerToEdit.email);
        setStatus(sellerToEdit.status);
      } else {
        setName('');
        setEmail('');
        setStatus('active');
      }
      setError('');
      setSuccessData(null);
      setCopied(false);
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen, sellerToEdit]);

  if (!isOpen) return null;

  const clearSecrets = () => {
    setPassword('');
    setShowPassword(false);
    setSuccessData(null);
    setCopied(false);
  };

  const handleGeneratePassword = () => {
    // Solo rellena el campo: el admin puede editarlo antes de enviar.
    setPassword(generatePassword());
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!sellerToEdit) {
      const passwordError = validatePassword(password);
      if (passwordError) { setError(passwordError); return; }
    }

    setIsSubmitting(true);

    try {
      if (sellerToEdit) {
        // Modo Edición
        const res = await updateSeller(sellerToEdit.id, { name, email, status });
        if (!res.success) {
          setError(res.message || 'Error desconocido');
        } else {
          onComplete(); // Cerramos directo tras editar
        }
      } else {
        // Modo Creación: se envía exactamente la contraseña escrita por el admin.
        const res = await createSeller({ name, email, password });
        if (!res.success) {
          setError(res.message || 'Error desconocido');
        } else {
          setSuccessData({ ...(res.seller as Seller), tempPassword: password });
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
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/login`;
    
    // Solo portapapeles: la clave nunca va en una URL ni en parámetros de consulta.
    navigator.clipboard.writeText(
      `¡Hola ${successData.name}! Te he creado tu usuario como vendedor en el sistema RIO.\n\nIngresa a tu panel de ventas (POS) aquí: ${inviteUrl}\nCorreo: ${successData.email}\nContraseña: ${successData.tempPassword}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    const wasCreated = !!successData;
    clearSecrets();
    if (wasCreated) {
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
            {successData ? '¡Vendedor Registrado!' : sellerToEdit ? 'Editar Vendedor' : 'Nuevo Vendedor'}
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

            {!sellerToEdit && (
              <div className="bg-rio-gold-light/10 border border-rio-gold-light rounded-xl p-3 text-xs text-rio-ink leading-relaxed">
                <strong>Acceso Seguro:</strong> Se creará una cuenta real con la contraseña que definas aquí. Podrás compartirle las credenciales para que inicie sesión y registre ventas.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Nombre Completo *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="Ej. Carlos Martínez" />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Correo Electrónico *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="vendedor@empresa.com" />
              </div>

              {!sellerToEdit && (
                <div>
                  <label htmlFor="seller-password" className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Contraseña Inicial *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="seller-password"
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full border border-rio-border rounded-xl p-2.5 pr-10 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold"
                        placeholder="Escribe la contraseña"
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
              )}

              {sellerToEdit && (
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Estado en la empresa</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold">
                    <option value="active">Activo (Puede ingresar al sistema)</option>
                    <option value="suspended">Inactivo (No puede ingresar)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 pt-4 border-t border-rio-border">
              <button type="button" onClick={handleClose} disabled={isSubmitting} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors flex justify-center items-center">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : sellerToEdit ? 'Guardar Cambios' : 'Crear Vendedor'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-5">
            <CheckCircle className="w-16 h-16 text-rio-success mx-auto" />
            
            <div>
              <h4 className="text-xl font-bold text-rio-ink mb-1">{successData.name}</h4>
              <p className="text-sm text-rio-muted">El perfil ha sido creado con éxito y su acceso real está configurado.</p>
            </div>

            <div className="bg-rio-background border border-rio-border rounded-xl p-4 text-left">
              <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-2">Credenciales (se muestran solo ahora):</p>
              <p className="text-sm text-rio-ink font-serif italic mb-4">
                {`¡Hola ${successData.name}! Te he creado tu usuario como vendedor en el sistema RIO. Ingresa aquí:`}<br/><br/>
                URL: <span className="font-mono text-rio-gold-dark text-xs">{window.location.origin}/login</span><br/>
                Correo: <span className="font-mono text-rio-gold-dark text-xs">{successData.email}</span><br/>
                Contraseña inicial: <span className="font-mono text-rio-gold-dark text-xs font-bold">{successData.tempPassword}</span>
              </p>
              <button 
                onClick={copyInviteLink}
                className="w-full py-2.5 bg-rio-surface-muted border border-rio-border rounded-lg text-[13px] font-bold text-rio-ink hover:bg-rio-border transition-colors flex justify-center items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-rio-success" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar para WhatsApp'}
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
