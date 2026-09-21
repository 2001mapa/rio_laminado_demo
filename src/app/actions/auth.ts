'use server'

import { createClient } from '@/utils/supabase/server'

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
