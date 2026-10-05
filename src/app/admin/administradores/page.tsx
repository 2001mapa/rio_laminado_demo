'use client';

import { useCallback, useEffect, useState } from 'react';
import { createAdministrator, listAdministrators, setAdministratorDisabled } from '@/app/actions/admins';
import { validatePassword } from '@/lib/passwordPolicy';

type Admin = Awaited<ReturnType<typeof listAdministrators>>[number];

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    try {
      setAdmins(await listAdministrators());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar la lista.');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const issue = validatePassword(password);
    if (issue) { setMessage(issue); return; }
    setBusy(true);
    try {
      const result = await createAdministrator({ name, email, password });
      if (!result.success) { setMessage(result.message || 'No se pudo crear la cuenta.'); return; }
      setName(''); setEmail(''); setPassword('');
      setMessage('Administrador creado. Comparte la contraseña por un canal seguro.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally { setBusy(false); }
  }

  async function toggle(admin: Admin) {
    setBusy(true);
    try {
      const result = await setAdministratorDisabled(admin.id, !admin.disabled);
      setMessage(result.success ? 'Acceso actualizado.' : result.message || 'No se pudo actualizar.');
      if (result.success) await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar.');
    } finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-5xl space-y-6 p-4 pb-20 md:p-8">
    <div>
      <h1 className="font-serif text-3xl font-bold text-rio-ink">Administradores</h1>
      <p className="mt-1 text-sm text-rio-muted">Solo la cuenta principal puede crear o suspender estos accesos.</p>
    </div>
    {message && <p role="status" className="rounded-xl border border-rio-border bg-white p-3 text-sm text-rio-ink">{message}</p>}
    <form onSubmit={create} className="rounded-2xl border border-rio-border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">Crear administrador</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium">Nombre<input className="mt-1 w-full rounded-xl border border-rio-border p-3" value={name} onChange={e => setName(e.target.value)} required /></label>
        <label className="text-sm font-medium">Correo<input type="email" className="mt-1 w-full rounded-xl border border-rio-border p-3" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="text-sm font-medium">Contraseña<input type="password" className="mt-1 w-full rounded-xl border border-rio-border p-3" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" /></label>
      </div>
      <p className="mt-3 text-xs text-rio-muted">Mínimo 8 caracteres, con mayúscula, minúscula y número. La contraseña no volverá a mostrarse.</p>
      <button disabled={busy} className="mt-4 rounded-xl bg-rio-ink px-5 py-3 font-semibold text-white disabled:opacity-50">Crear acceso</button>
    </form>
    <section className="rounded-2xl border border-rio-border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">Cuentas con acceso administrativo</h2>
      <div className="divide-y divide-rio-border">
        {admins.map(admin => <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div><p className="font-semibold">{admin.name || admin.email} {admin.primary && <span className="text-xs text-rio-muted">(principal)</span>}</p><p className="text-sm text-rio-muted">{admin.email} · {admin.disabled ? 'Suspendido' : 'Activo'}</p></div>
          {!admin.primary && <button type="button" disabled={busy} onClick={() => void toggle(admin)} className="rounded-xl border border-rio-border px-4 py-2 text-sm font-semibold disabled:opacity-50">{admin.disabled ? 'Reactivar' : 'Suspender'}</button>}
        </div>)}
      </div>
    </section>
  </main>;
}
