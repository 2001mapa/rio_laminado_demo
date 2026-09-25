import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma'; // Usa el cliente compartido para no agotar conexiones

export type Role = 'admin' | 'vendedor' | 'cliente';

export async function getSessionUser(): Promise<{ user: User | null; role: Role | null; status?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Loggear errores de forma silenciosa sin filtrar tokens
      console.error(`[ServerAction] Supabase Auth Error: ${error.name} - ${error.status}`);
      throw new Error(`Supabase Auth Error: ${error.message}`);
    }
    
    if (!user) {
      return { user: null, role: null };
    }

    // Usamos exclusivamente app_metadata por seguridad
    let role = (user.app_metadata?.role as Role) || null;
    let status = 'active';

    if (role === 'admin') {
      return { user, role, status: 'active' };
    }

    try {
      // Centralizar la verificación de estado y resolución
      const seller = await prisma.seller.findUnique({ where: { authUserId: user.id } });
      if (seller) {
        role = 'vendedor';
        status = seller.status;
      } else {
        const customer = await prisma.customer.findUnique({ where: { authUserId: user.id } });
        if (customer) {
          role = 'cliente';
          status = customer.status;
        } else {
          // Si no está en BD y no es admin en app_metadata, es un usuario huerfano/inválido
          role = null as any;
        }
      }
    } catch (dbError) {
      console.error('[ServerAction] Database fallback error');
    }

    return { user, role, status };
  } catch (e: any) {
    throw new Error('Auth Helper Crash: ' + e.message);
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<{ user: User, role: Role }> {
  const { user, role, status } = await getSessionUser();
  
  if (!user) {
    throw new Error('No autorizado: Sesión de Supabase no encontrada');
  }
  if (!role) {
    throw new Error('No autorizado: Rol o perfil no encontrado');
  }
  if (status !== 'active' && role !== 'admin') {
    throw new Error('No autorizado: Tu cuenta ha sido suspendida.');
  }
  if (!allowedRoles.includes(role)) {
    throw new Error(`No autorizado: Rol "${role}" no permitido`);
  }
  
  return { user, role };
}
