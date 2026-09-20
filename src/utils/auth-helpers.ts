import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

export type Role = 'admin' | 'vendedor' | 'cliente';

export async function getSessionUser(): Promise<{ user: User | null; role: Role | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error('Supabase Auth Error: ' + error.message);
    }
    if (!user) {
      return { user: null, role: null };
    }

    const role = (user.user_metadata?.role as Role) || null; // No fallback
    return { user, role };
  } catch (e: any) {
    throw new Error('Auth Helper Crash: ' + e.message);
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<User> {
  const { user, role } = await getSessionUser();
  
  if (!user) {
    throw new Error('No autorizado: Sesión de Supabase no encontrada (user=null)');
  }
  if (!role) {
    throw new Error('No autorizado: Rol no encontrado');
  }
  if (!allowedRoles.includes(role)) {
    throw new Error(`No autorizado: Rol "${role}" no permitido`);
  }
  
  return user;
}
