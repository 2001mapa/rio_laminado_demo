'use server'

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
  
  const normalizedEmail = data.email.trim().toLowerCase();

  try {
    const existing = await prisma.seller.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existing) {
      return { success: false, message: 'Ya existe un vendedor con este correo electrónico.' };
    }

    const adminAuthClient = getAdminClient();
    
    // Check if auth user already exists by email
    const { data: usersData, error: usersError } = await adminAuthClient.auth.admin.listUsers();
    let authUser = usersData?.users.find(u => u.email === normalizedEmail);

    const tempPassword = `Vendedor-${Math.random().toString(36).substring(2, 8).toUpperCase()}*`;

    if (!authUser) {
      // Create user
      const { data: createdUser, error: createError } = await adminAuthClient.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: data.name, role: 'vendedor' },
        app_metadata: { role: 'vendedor' }
      });
      if (createError) throw new Error(`Error en Auth: ${createError.message}`);
      authUser = createdUser.user;
    } else {
      // Update existing user role
      await adminAuthClient.auth.admin.updateUserById(authUser.id, {
        app_metadata: { role: 'vendedor' },
        user_metadata: { name: data.name, role: 'vendedor' }
      });
    }

    // Now create in Prisma
    try {
      const seller = await prisma.seller.create({
        data: {
          name: data.name,
          email: normalizedEmail,
          authUserId: authUser!.id,
          status: 'active'
        }
      });
      return { 
        success: true, 
        message: 'Vendedor creado exitosamente.',
        seller: seller,
        tempPassword: tempPassword
      };
    } catch (dbError: any) {
      // Rollback Auth if Prisma fails
      await adminAuthClient.auth.admin.deleteUser(authUser!.id);
      throw new Error(`Error en DB: ${dbError.message}`);
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
