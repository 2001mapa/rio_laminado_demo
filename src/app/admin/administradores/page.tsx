'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, ShieldCheck, X } from 'lucide-react';
import { createAdministrator, listAdministrators, setAdministratorDisabled } from '@/app/actions/admins';
import { validatePassword } from '@/lib/passwordPolicy';
import Link from 'next/link';

type Admin = Awaited<ReturnType<typeof listAdministrators>>[number];

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    try { setAdmins(await listAdministrators()); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cargar la lista.'); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  function closeModal() {
    if (busy) return;
    setShowModal(false); setName(''); setEmail(''); setPassword('');
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const issue = validatePassword(password);
    if (issue) { setMessage(issue); return; }
    setBusy(true);
    try {
      const result = await createAdministrator({ name, email, password });
      if (!result.success) { setMessage(result.message || 'No se pudo crear la cuenta.'); return; }
      setName(''); setEmail(''); setPassword(''); setShowModal(false);
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

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div><h1 className="text-2xl md:text-3xl font-serif font-bold text-rio-ink">Administradores</h1><p className="mt-1 text-sm text-rio-muted">Solo la cuenta principal puede gestionar estos accesos.</p></div>
      <button type="button" onClick={() => { setMessage(''); setShowModal(true); }} className="flex min-h-11 items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"><Plus className="w-4 h-4 mr-2" />Nuevo Administrador</button>
    </div>

    {message && !showModal && <p role="status" className="rounded-xl border border-rio-border bg-rio-surface p-3 text-sm text-rio-ink">{message}</p>}
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rio-muted pointer-events-none" />
      <input type="search" aria-label="Buscar administradores" placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-rio-border rounded-xl leading-5 bg-rio-surface placeholder-rio-muted text-sm focus:outline-none focus:ring-1 focus:ring-rio-gold focus:border-rio-gold text-rio-ink" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredAdmins.map(admin => <div key={admin.id} className="bg-rio-surface rounded-2xl shadow-sm border border-rio-border p-6 flex flex-col hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-full bg-rio-surface-muted flex items-center justify-center text-xl font-serif text-rio-gold-dark border border-rio-border shrink-0 shadow-sm">{(admin.name || admin.email).charAt(0).toUpperCase()}</div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${admin.disabled ? 'bg-rio-danger/10 text-rio-danger border-rio-danger/20' : 'bg-rio-success/10 text-rio-success border-rio-success/20'}`}>{admin.disabled ? 'Suspendido' : 'Activo'}</span>
        </div>
        <h2 className="font-bold text-rio-ink line-clamp-1">{admin.name || admin.email}</h2>
        <p className="text-sm text-rio-muted mt-1 break-all">{admin.email}</p>
        <div className="mt-4 pt-4 border-t border-rio-border flex justify-between items-center gap-3">
          <div><p className="text-[10px] text-rio-muted uppercase font-bold tracking-wider">Tipo de acceso</p><p className="text-sm font-bold text-rio-ink">{admin.primary ? 'Principal' : 'Administrador'}</p></div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/administradores/${admin.id}`} className="flex items-center px-3 py-1.5 text-[12px] font-bold rounded-lg border border-rio-border bg-rio-surface text-rio-ink hover:bg-rio-surface-muted">Ver perfil</Link>
            {!admin.primary && <button type="button" disabled={busy} onClick={() => void toggle(admin)} className="flex items-center px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors border border-rio-border bg-rio-background text-rio-ink hover:bg-rio-surface-muted disabled:opacity-50">{admin.disabled ? 'Reactivar' : 'Suspender'}</button>}
          </div>
        </div>
      </div>)}
      {filteredAdmins.length === 0 && <div className="col-span-full py-12 text-center bg-rio-surface rounded-2xl border border-rio-border border-dashed"><ShieldCheck className="w-8 h-8 text-rio-muted mx-auto mb-3" /><p className="text-sm font-medium text-rio-muted">No se encontraron administradores.</p></div>}
    </div>

    {showModal && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeModal(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="new-admin-title" className="bg-rio-surface rounded-2xl w-full max-w-lg shadow-2xl border border-rio-border flex flex-col max-h-[90vh] animate-scale-in">
        <div className="flex items-center justify-between border-b border-rio-border p-5"><h2 id="new-admin-title" className="text-xl font-serif font-bold text-rio-ink">Nuevo Administrador</h2><button type="button" onClick={closeModal} disabled={busy} aria-label="Cerrar" className="rounded-lg p-2 hover:bg-rio-surface-muted"><X className="w-5 h-5" /></button></div>
        <form onSubmit={create} className="space-y-4 overflow-y-auto p-5">
          <label className="block text-sm font-semibold text-rio-ink">Nombre<input autoFocus className="mt-1 w-full rounded-xl border border-rio-border p-3 font-normal" value={name} onChange={e => setName(e.target.value)} required /></label>
          <label className="block text-sm font-semibold text-rio-ink">Correo electrónico<input type="email" className="mt-1 w-full rounded-xl border border-rio-border p-3 font-normal" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label className="block text-sm font-semibold text-rio-ink">Contraseña<input type="password" className="mt-1 w-full rounded-xl border border-rio-border p-3 font-normal" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" /></label>
          <p className="text-xs text-rio-muted">Mínimo 8 caracteres, con mayúscula, minúscula y número. La contraseña no volverá a mostrarse.</p>
          {message && <p role="alert" className="text-sm text-rio-danger">{message}</p>}
          <div className="flex gap-3 pt-2"><button type="button" onClick={closeModal} disabled={busy} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted">Cancelar</button><button disabled={busy} className="flex-1 py-3 bg-rio-ink text-white rounded-xl text-sm font-semibold disabled:opacity-50">{busy ? 'Creando...' : 'Crear acceso'}</button></div>
        </form>
      </div>
    </div>}
  </div>;
}
