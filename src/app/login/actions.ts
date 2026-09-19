'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Truco técnico: Enmascaramos el "Usuario" como correo agregando @rio.local
  const rawUser = formData.get('username') as string
  const password = formData.get('password') as string

  if (!rawUser || !password) {
    return { success: false, message: 'Faltan credenciales' }
  }

  const email = rawUser.includes('@') ? rawUser : `${rawUser}@rio.local`

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: 'Usuario o contraseña incorrectos' }
  }

  // Redirigir basado en el rol
  const role = data.user?.user_metadata?.role || 'admin';
  if (role === 'admin') redirect('/admin');
  if (role === 'vendedor') redirect('/vendedor');
  if (role === 'cliente') redirect('/cliente/buscar');
  
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
