import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { canManageAdmins, getAdministratorProfile } from '@/app/actions/admins';
import ResetPasswordForm from './ResetPasswordForm';

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(value))
  : 'Sin registro';

export default async function AdministratorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  if (!await canManageAdmins()) redirect('/admin');
  const { id } = await params;
  const admin = await getAdministratorProfile(id);
  if (!admin) notFound();

  return <main className="mx-auto max-w-5xl space-y-6 p-4 pb-20 md:p-8">
    <div className="flex items-center gap-3">
      <Link href="/admin/administradores" aria-label="Volver a administradores" className="rounded-xl border border-rio-border bg-rio-surface p-2.5 text-rio-ink hover:bg-rio-surface-muted"><ArrowLeft className="h-5 w-5" /></Link>
      <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-rio-muted">Administradores</p><h1 className="text-2xl font-bold text-rio-ink md:text-3xl">Perfil de administrador</h1></div>
    </div>

    <div className="grid gap-6 md:grid-cols-3">
      <section className="rounded-2xl border border-rio-border bg-rio-surface p-6 shadow-sm md:col-span-1">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-rio-border bg-rio-surface-muted text-3xl text-rio-gold-dark">{(admin.name || admin.email).charAt(0).toUpperCase()}</div>
        <h2 className="break-words text-xl font-bold text-rio-ink">{admin.name || admin.email}</h2>
        <p className="mt-1 break-all text-sm text-rio-muted">{admin.email}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`rounded-md border px-2 py-1 text-xs font-bold ${admin.disabled ? 'border-rio-danger/20 bg-rio-danger/10 text-rio-danger' : 'border-rio-success/20 bg-rio-success/10 text-rio-success'}`}>{admin.disabled ? 'Suspendido' : 'Activo'}</span>
          {admin.primary && <span className="rounded-md border border-rio-gold-light bg-rio-gold-light/20 px-2 py-1 text-xs font-bold text-rio-gold-dark">Cuenta principal</span>}
        </div>
        <div className="mt-6 border-t border-rio-border pt-4 text-sm text-rio-muted"><ShieldCheck className="mr-2 inline h-4 w-4" />La contraseña no se puede consultar desde este perfil.</div>
      </section>

      <section className="rounded-2xl border border-rio-border bg-rio-surface p-6 shadow-sm md:col-span-2">
        <h2 className="border-b border-rio-border pb-3 text-sm font-bold uppercase tracking-wide text-rio-ink">Datos de acceso</h2>
        <dl className="mt-5 grid gap-6 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-bold uppercase tracking-wide text-rio-muted">Correo de acceso</dt><dd className="mt-1 break-all font-medium text-rio-ink">{admin.email}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-rio-muted">Tipo de cuenta</dt><dd className="mt-1 font-medium text-rio-ink">{admin.primary ? 'Administradora principal' : 'Administrador'}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-rio-muted">Fecha de creación</dt><dd className="mt-1 font-medium text-rio-ink">{formatDate(admin.createdAt)}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-rio-muted">Último acceso</dt><dd className="mt-1 font-medium text-rio-ink">{formatDate(admin.lastSignInAt)}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-rio-muted">Correo confirmado</dt><dd className="mt-1 font-medium text-rio-ink">{formatDate(admin.emailConfirmedAt)}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-rio-muted">Última actualización</dt><dd className="mt-1 font-medium text-rio-ink">{formatDate(admin.updatedAt)}</dd></div>
        </dl>
      </section>
      {!admin.primary && <ResetPasswordForm administratorId={admin.id} />}
    </div>
  </main>;
}
