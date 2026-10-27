'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentSession() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error fetching session on server:', error)
    return null
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}


import { getSessionUser } from '@/utils/auth-helpers'
import { sendDiscordAlert } from '@/lib/discord-monitoring'
import { prisma } from '@/lib/prisma'
import { createHash } from 'node:crypto'

export async function resolveLoginDestination() {
  const { user, role, status } = await getSessionUser();
  if (!user || !role) {
    if (user) await sendDiscordAlert('access_denied', 'login', { operation: 'resolveLoginDestination', reason: 'invalid_role', route: '/login' });
    return { success: false, message: 'Usuario sin rol asignado o perfil inválido.' };
  }
  if (status !== 'active') {
    await sendDiscordAlert('access_denied', 'login', { operation: 'resolveLoginDestination', reason: 'suspended', route: '/login' });
    return { success: false, message: 'Tu cuenta ha sido suspendida.' };
  }
  const targetPath = role === 'admin' ? '/admin' : role === 'vendedor' ? '/vendedor' : '/cliente';
  return { success: true, targetPath };
}

export async function recordClientLogin() {
  try {
    const { user, role, status } = await getSessionUser();
    if (!user || role !== 'cliente' || status !== 'active' || !user.last_sign_in_at) return;

    const signedInAt = new Date(user.last_sign_in_at);
    const age = Date.now() - signedInAt.getTime();
    // Only record a freshly authenticated session, never a later page visit.
    if (!Number.isFinite(age) || age < -60_000 || age > 10 * 60_000) return;

    const customer = await prisma.customer.findUnique({
      where: { authUserId: user.id },
      select: { id: true, name: true },
    });
    if (!customer) return;

    const id = `client-login:${createHash('sha256').update(`${user.id}:${user.last_sign_in_at}`).digest('hex')}`;
    await prisma.auditEvent.create({
      data: {
        id,
        createdAt: signedInAt,
        actorId: user.id,
        actorName: customer.name,
        actorRole: 'cliente',
        action: 'LOGIN',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        origin: 'system',
        result: 'success',
      },
    });
  } catch (error: any) {
    // A repeated call for the same Supabase sign-in has the same event ID.
    if (error?.code !== 'P2002') console.error('Could not record client login:', error);
  }
}
