'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { resetAdministratorPassword } from '@/app/actions/admins';
import { validatePassword } from '@/lib/passwordPolicy';

export default function ResetPasswordForm({ administratorId }: { administratorId: string }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validatePassword(password);
    if (issue) { setMessage(issue); setSuccess(false); return; }
    setBusy(true);
    setMessage('');
    try {
      const result = await resetAdministratorPassword(administratorId, password);
      setSuccess(result.success);
      setMessage(result.success
        ? result.auditWarning || 'Contraseña restablecida. Compártela por un canal seguro.'
        : result.message || 'No se pudo cambiar la contraseña.');
      if (result.success) { setPassword(''); setShowPassword(false); }
    } catch {
      setSuccess(false);
      setMessage('No se pudo cambiar la contraseña. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="rounded-2xl border border-rio-border bg-rio-surface p-6 shadow-sm md:col-span-2">
    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rio-ink"><KeyRound className="h-4 w-4" />Restablecer contraseña</h2>
    <p className="mt-2 text-sm text-rio-muted">Esto reemplaza la contraseña actual; no permite consultarla.</p>
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label htmlFor="reset-admin-password" className="text-sm font-semibold text-rio-ink">Nueva contraseña</label>
        <div className="relative mt-1">
          <input id="reset-admin-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-rio-border p-3 pr-12 text-rio-ink" />
          <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-rio-muted hover:text-rio-ink">
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-rio-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Guardando...' : 'Restablecer acceso'}</button>
    </form>
    <p className="mt-2 text-xs text-rio-muted">Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>
    {message && <p role={success ? 'status' : 'alert'} className={`mt-3 text-sm ${success ? 'text-rio-success' : 'text-rio-danger'}`}>{message}</p>}
  </section>;
}
