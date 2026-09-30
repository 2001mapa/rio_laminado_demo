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

function isValidEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export async function createSeller(data: {
  name: string;
  email: string;
}) {
  await requireRole(['admin']);
  
  const trimmedName = data.name?.trim();
  const normalizedEmail = data.email?.trim().toLowerCase();
  
  if (!trimmedName) return { success: false, message: 'El nombre es obligatorio.' };
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) return { success: false, message: 'Correo electrónico inválido.' };

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
      user_metadata: { name: trimmedName, role: 'vendedor' },
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
            name: trimmedName,
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
        try {
          const { error: deleteError } = await adminAuthClient.auth.admin.deleteUser(authUser.id);
          if (deleteError) {
            return { success: false, message: `ATENCIÓN: Error en BD (${dbError.message}). Eliminar cuenta Auth devolvió error (${deleteError.message}). Posible inconsistencia.` };
          }
        } catch (compensationEx: any) {
          return { success: false, message: `ATENCIÓN: Error en BD (${dbError.message}). Excepción al intentar eliminar cuenta Auth (${compensationEx.message}). Posible inconsistencia.` };
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
  
  const trimmedName = data.name?.trim();
  const normalizedEmail = data.email?.trim().toLowerCase();
  const validStatuses = ['active', 'suspended'];
  
  if (!trimmedName) return { success: false, message: 'El nombre es obligatorio.' };
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) return { success: false, message: 'Correo electrónico inválido.' };
  if (!validStatuses.includes(data.status)) return { success: false, message: 'Estado inválido.' };

  try {
    const existing = await prisma.seller.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existing && existing.id !== id) {
      return { success: false, message: 'El correo electrónico ya está en uso por otro vendedor.' };
    }

    const existingSeller = await prisma.seller.findUnique({ where: { id } });
    if (!existingSeller) return { success: false, message: 'Vendedor no encontrado.' };
    
    if (!existingSeller.authUserId) {
      return { success: false, message: 'El vendedor no tiene un usuario de autenticación vinculado (authUserId).' };
    }

    const adminAuthClient = getAdminClient();
    let authUpdated = false;

    // 1. UPDATE AUTH FIRST
    try {
      const { error: authError } = await adminAuthClient.auth.admin.updateUserById(existingSeller.authUserId, {
        email: normalizedEmail,
        user_metadata: { name: trimmedName }
      });
      if (authError) {
        return { success: false, message: `Error de Auth, actualización cancelada: ${authError.message}` };
      }
      authUpdated = true;
    } catch (authEx: any) {
      return { success: false, message: `Excepción de Auth, actualización cancelada: ${authEx.message}` };
    }

    // 2. UPDATE PRISMA + AUDIT EVENT IN TRANSACTION
    try {
      const actor = await getAuditActor();
      const seller = await prisma.$transaction(async (tx) => {
        const updated = await tx.seller.update({
          where: { id },
          data: {
            name: trimmedName,
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
        try {
          const { error: compensationError } = await adminAuthClient.auth.admin.updateUserById(existingSeller.authUserId, {
            email: existingSeller.email, // rollback email
            user_metadata: { name: existingSeller.name } // rollback name
          });
          
          if (compensationError) {
            return { success: false, message: `ATENCIÓN: Falló actualización local (${dbError.message}). Reversión de Auth devolvió error (${compensationError.message}). Inconsistencia detectada.` };
          }
        } catch (compensationEx: any) {
          return { success: false, message: `ATENCIÓN: Falló actualización local (${dbError.message}). Excepción al intentar reversión de Auth (${compensationEx.message}). Inconsistencia detectada.` };
        }
      }
      return { success: false, message: `Error interno al actualizar base de datos, cambios de Auth revertidos exitosamente: ${dbError.message}` };
    }
  } catch (error: any) {
    console.error('Error updating seller:', error);
    return { success: false, message: `Error general: ${error.message}` };
  }
}
