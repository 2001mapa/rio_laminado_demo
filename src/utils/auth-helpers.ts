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

    let role = (user.app_metadata?.role as Role) || null;

    // Si no está en app_metadata, verificamos en la base de datos (fuente de verdad)
    if (!role) {
      if (user.user_metadata?.role === 'admin' || user.email === '2001mapa@gmail.com') {
        role = 'admin';
      } else {
        try {
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
          
          const seller = await prisma.seller.findUnique({ where: { authUserId: user.id } });
          if (seller) {
            role = 'vendedor';
          } else {
            const customer = await prisma.customer.findUnique({ where: { authUserId: user.id } });
            if (customer) {
              role = 'cliente';
            }
          }
        } catch (dbError) {
          console.error('[ServerAction] Database fallback error:', dbError);
        }
      }
    }

    return { user, role };
  } catch (e: any) {
    throw new Error('Auth Helper Crash: ' + e.message);
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<{ user: User, role: Role }> {
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
  return { user, role };
}
