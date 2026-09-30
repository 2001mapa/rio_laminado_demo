'use server';
import { logAuditEvent, getAuditActor } from '@/lib/audit';
import crypto from 'crypto';


import { prisma } from '@/lib/prisma'
import { requireRole } from '@/utils/auth-helpers'
import { createClient } from '@supabase/supabase-js'

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseAdminUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function createSeller(data: {
  name: string;
  email: string;
}) {
  await requireRole(['admin']);
  if (!data.name || !data.email) return { success: false, message: 'Datos incompletos.' };
  
  const normalizedEmail = data.email.trim().toLowerCase();

  try {
    const existing = await prisma.seller.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existing) {
      return { success: false, message: 'Ya existe un perfil de vendedor con este correo electrónico.' };
    }

    const adminAuthClient = getAdminClient();
    
    const tempPassword = 'V-' + crypto.randomBytes(6).toString('hex').toUpperCase() + '*Ab1';
    let authUser = null;
    let newlyCreated = false;

    const { data: createdUser, error: createError } = await adminAuthClient.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: data.name, role: 'vendedor' },
      app_metadata: { role: 'vendedor' }
    });

    if (createError) {
      return { success: false, message: `La cuenta ya existe en autenticación o hubo un error: ${createError.message}` };
    }
    
    authUser = createdUser.user;
    newlyCreated = true;

    // Now create in Prisma
    try {
      const actor = await getAuditActor();
      const seller = await prisma.$transaction(async (tx) => {
        const createdSeller = await tx.seller.create({
          data: {
            name: data.name,
            email: normalizedEmail,
            authUserId: authUser!.id,
            status: 'active'
          }
        });
        await logAuditEvent(actor, { action: 'CREATE_SELLER', entityType: 'SELLER', entityId: createdSeller.id, changes: { email: createdSeller.email } }, tx);
        return createdSeller;
      });

      return { 
        success: true, 
        seller,
        tempPassword
      };
    } catch (dbError: any) {
      // Compensación manual si falla la base de datos
      if (newlyCreated && authUser) {
        const { error: deleteError } = await adminAuthClient.auth.admin.deleteUser(authUser.id);
        if (deleteError) {
          return { success: false, message: `ATENCIÓN: Error en base de datos al guardar perfil (${dbError.message}). Intento de eliminar cuenta en Auth también falló (${deleteError.message}). Inconsistencia detectada, cuenta huérfana en Auth.` };
        }
      }
      return { success: false, message: `Error en base de datos al guardar perfil, cuenta de auth revertida exitosamente: ${dbError.message}` };
    }

  } catch (error: any) {
    console.error('Error creating seller:', error);
    return { success: false, message: `Error interno al crear el vendedor: ${error.message}` };
  }
}

export async function updateSeller(id: string, data: {
  name: string;
  email: string;
  status: string;
}) {
  await requireRole(['admin']);
  if (!data.name || !data.email || !data.status) return { success: false, message: 'Faltan datos requeridos.' };
  
  const normalizedEmail = data.email.trim().toLowerCase();

  try {
    const existing = await prisma.seller.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existing && existing.id !== id) {
      return { success: false, message: 'El correo electrónico ya está en uso por otro vendedor.' };
    }

    const existingSeller = await prisma.seller.findUnique({ where: { id } });
    if (!existingSeller) return { success: false, message: 'Vendedor no encontrado.' };

    const adminAuthClient = getAdminClient();
    let authUpdated = false;

    // 1. UPDATE AUTH FIRST
    if (existingSeller.authUserId) {
      const { error: authError } = await adminAuthClient.auth.admin.updateUserById(existingSeller.authUserId, {
        email: normalizedEmail,
        user_metadata: { name: data.name }
      });
      if (authError) {
        return { success: false, message: `Error de Auth, actualización cancelada: ${authError.message}` };
      }
      authUpdated = true;
    }

    // 2. UPDATE PRISMA + AUDIT EVENT IN TRANSACTION
    try {
      const actor = await getAuditActor();
      const seller = await prisma.$transaction(async (tx) => {
        const updated = await tx.seller.update({
          where: { id },
          data: {
            name: data.name,
            email: normalizedEmail,
            status: data.status
          }
        });

        await logAuditEvent(actor, {
          action: 'UPDATE_SELLER',
          entityType: 'SELLER',
          entityId: id,
          changes: {
            before: { name: existingSeller.name, email: existingSeller.email, status: existingSeller.status },
            after: { name: updated.name, email: updated.email, status: updated.status }
          }
        }, tx);

        return updated;
      });

      return { 
        success: true, 
        message: 'Vendedor actualizado exitosamente.',
        seller: seller 
      };
    } catch (dbError: any) {
      // 3. COMPENSATION IF DB/AUDIT FAILS
      if (authUpdated && existingSeller.authUserId) {
        const { error: compensationError } = await adminAuthClient.auth.admin.updateUserById(existingSeller.authUserId, {
          email: existingSeller.email, // rollback email
          user_metadata: { name: existingSeller.name } // rollback name
        });
        
        if (compensationError) {
          return { success: false, message: `ATENCIÓN: Falló actualización local (${dbError.message}). Intento de reversión de Auth falló (${compensationError.message}). Inconsistencia detectada entre Auth y la base de datos local.` };
        }
      }
      return { success: false, message: `Error interno al actualizar base de datos, cambios de Auth revertidos exitosamente: ${dbError.message}` };
    }
  } catch (error: any) {
    console.error('Error updating seller:', error);
    return { success: false, message: `Error general: ${error.message}` };
  }
}
