import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

export type Role = 'admin' | 'vendedor' | 'cliente';

export async function getSessionUser(): Promise<{ user: User | null; role: Role | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, role: null };
    }

    const role = (user.user_metadata?.role as Role) || 'admin'; // Fallback to admin if not specified (manual accounts)
    return { user, role };
  } catch (e) {
    return { user: null, role: null };
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<User> {
  const { user, role } = await getSessionUser();
  
  if (!user || !role || !allowedRoles.includes(role)) {
    throw new Error('No autorizado');
  }
  
  return user;
}
