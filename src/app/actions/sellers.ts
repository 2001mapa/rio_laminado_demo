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
        await adminAuthClient.auth.admin.deleteUser(authUser.id);
      }
      return { success: false, message: `Error en base de datos al guardar perfil, cuenta de auth revertida: ${dbError.message}` };
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

    const seller = await prisma.seller.update({
      where: { id },
      data: {
        name: data.name,
        email: normalizedEmail,
        status: data.status
      }
    });

    if (seller.authUserId) {
      const adminAuthClient = getAdminClient();
      await adminAuthClient.auth.admin.updateUserById(seller.authUserId, {
        email: normalizedEmail,
        user_metadata: { name: data.name }
      });
    }

    const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: 'UPDATE_SELLER',
      entityType: 'SELLER',
      entityId: id,
      changes: {
        before: { name: existingSeller.name, email: existingSeller.email, status: existingSeller.status },
        after: { name: seller.name, email: seller.email, status: seller.status }
      }
    });

    return { 
      success: true, 
      message: 'Vendedor actualizado exitosamente.',
      seller: seller 
    };
  } catch (error: any) {
    console.error('Error updating seller:', error);
    return { success: false, message: `Error interno al actualizar el vendedor: ${error.message}` };
  }
}
