import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

export type Role = 'admin' | 'vendedor' | 'cliente';

export async function getSessionUser(): Promise<{ user: User | null; role: Role | null }> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieNames = cookieStore.getAll().map(c => c.name);
    console.log(`[ServerAction] Cookies received: ${cookieNames.join(', ')}`);

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error(`[ServerAction] Supabase Auth Error: ${error.name} - ${error.message} - ${error.status}`);
      throw new Error(`Supabase Auth Error: ${error.message}`);
    }
    
    console.log(`[ServerAction] User found: ${!!user} | Role: ${user?.user_metadata?.role}`);
    
    if (!user) {
      return { user: null, role: null };
    }

    // TODO: Migrar validación de roles a app_metadata o a una tabla de roles protegida.
    // Actualmente se usa user_metadata.role que puede ser modificado por el usuario
    // si no hay políticas estrictas.
    const role = (user.user_metadata?.role as Role) || null;
    return { user, role };
  } catch (e: any) {
    throw new Error('Auth Helper Crash: ' + e.message);
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<User> {
  const { user, role } = await getSessionUser();
  
  if (!user) {
    console.log(`[requireRole] Rejection: No Supabase session found (user=null)`);
    throw new Error('No autorizado: Sesión de Supabase no encontrada (user=null)');
  }
  if (!role) {
    console.log(`[requireRole] Rejection: Role not found for user. Metadata:`, user.user_metadata);
    throw new Error('No autorizado: Rol no encontrado');
  }
  if (!allowedRoles.includes(role)) {
    console.log(`[requireRole] Rejection: Role "${role}" not in allowed list [${allowedRoles.join(', ')}]`);
    throw new Error(`No autorizado: Rol "${role}" no permitido`);
  }
  
  console.log(`[requireRole] Success: User verified with role "${role}"`);
  return user;
}
