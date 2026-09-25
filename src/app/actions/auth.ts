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

export async function resolveLoginDestination() {
  const { user, role, status } = await getSessionUser();
  if (!user || !role) {
    return { success: false, message: 'Usuario sin rol asignado o perfil inválido.' };
  }
  if (status !== 'active' && role !== 'admin') {
    return { success: false, message: 'Tu cuenta ha sido suspendida.' };
  }
  const targetPath = role === 'admin' ? '/admin' : role === 'vendedor' ? '/vendedor' : '/cliente';
  return { success: true, targetPath };
}
