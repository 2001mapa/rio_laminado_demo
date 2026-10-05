'use server';

import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/utils/auth-helpers';
import { describeAuthPasswordError, validatePassword } from '@/lib/passwordPolicy';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Falta configurar Supabase en el servidor.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requirePrimaryAdmin() {
  const { user } = await requireRole(['admin']);
  const primaryId = process.env.PRIMARY_ADMIN_USER_ID;
  if (!primaryId || user.id !== primaryId) throw new Error('Solo la cuenta principal puede gestionar administradores.');
  return user;
}

export async function canManageAdmins() {
  try {
    await requirePrimaryAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function listAdministrators() {
  await requirePrimaryAdmin();
  const client = adminClient();
  const admins: { id: string; email: string; name: string; disabled: boolean; primary: boolean }[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error('No se pudo consultar la lista de administradores.');
    for (const user of data.users) {
      if (user.app_metadata?.role === 'admin') {
        admins.push({
          id: user.id,
          email: user.email || '',
          name: String(user.user_metadata?.name || ''),
          disabled: user.app_metadata?.adminDisabled === true,
          primary: user.id === process.env.PRIMARY_ADMIN_USER_ID,
        });
      }
    }
    if (data.users.length < 100) break;
  }
  return admins;
}

export async function createAdministrator(data: { name: string; email: string; password: string }) {
  await requirePrimaryAdmin();
  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Indica un nombre y un correo válidos.' };
  }
  const passwordError = validatePassword(data.password);
  if (passwordError) return { success: false, message: passwordError };
  const { data: result, error } = await adminClient().auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: { role: 'admin', adminDisabled: false },
  });
  if (error) return { success: false, message: describeAuthPasswordError(error) || error.message };
  return { success: true, id: result.user.id };
}

export async function setAdministratorDisabled(id: string, disabled: boolean) {
  await requirePrimaryAdmin();
  if (!id || id === process.env.PRIMARY_ADMIN_USER_ID) {
    return { success: false, message: 'No se puede suspender la cuenta principal.' };
  }
  const client = adminClient();
  const { data: target, error: lookupError } = await client.auth.admin.getUserById(id);
  if (lookupError || target.user?.app_metadata?.role !== 'admin') {
    return { success: false, message: 'Administrador no encontrado.' };
  }
  const { error } = await client.auth.admin.updateUserById(id, {
    app_metadata: { ...target.user.app_metadata, adminDisabled: disabled },
  });
  if (error) return { success: false, message: error.message };
  return { success: true };
}
