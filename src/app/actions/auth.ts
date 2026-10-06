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

export async function resolveLoginDestination() {
  const { user, role, status } = await getSessionUser();
  if (!user || !role) {
    if (user) await sendDiscordAlert('access_denied', 'login', 'invalid_role');
    return { success: false, message: 'Usuario sin rol asignado o perfil inválido.' };
  }
  if (status !== 'active') {
    await sendDiscordAlert('access_denied', 'login', 'suspended');
    return { success: false, message: 'Tu cuenta ha sido suspendida.' };
  }
  const targetPath = role === 'admin' ? '/admin' : role === 'vendedor' ? '/vendedor' : '/cliente';
  return { success: true, targetPath };
}
