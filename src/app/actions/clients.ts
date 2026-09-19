'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export async function createCustomer(data: {
  name: string;
  username: string; // Nuevo campo
  email?: string;
  phone?: string;
  address?: string;
  discount: number;
  showDiscount: boolean;
  temporaryPassword?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseKey) {
      return { success: false, message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.' };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Verificar en Prisma
    if (data.username) {
      const existing = await prisma.customer.findUnique({
        where: { username: data.username }
      });
      if (existing) {
        return { success: false, message: 'Ya existe un cliente con ese Usuario.' };
      }
    }

    if (data.email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email: data.email }
      });
      if (existingEmail) {
        return { success: false, message: 'Ya existe un cliente con este correo electrónico.' };
      }
    }

    let authId: string | undefined = undefined;

    // 2. Crear en Supabase Auth usando el truco del correo falso
    if (data.username && data.temporaryPassword) {
      const dummyEmail = `${data.username}@rio.local`;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password: data.temporaryPassword,
        email_confirm: true,
        user_metadata: {
          role: 'cliente',
          name: data.name,
          username: data.username,
        }
      });

      if (authError) {
        return { success: false, message: `Error de seguridad: ${authError.message}` };
      }

      authId = authData.user.id;
    }

    const customer = await prisma.customer.create({
      data: {
        authUserId: authId,
        name: data.name,
        username: data.username,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        discount: data.discount,
        showDiscount: data.showDiscount,
      }
    });

    return { 
      success: true, 
      message: 'Cliente creado exitosamente.',
      customer: customer 
    };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return { success: false, message: `Error interno al crear el cliente: ${error.message}` };
  }
}

export async function updateCustomerStatusAction(id: string, data: {
  status?: string;
  showDiscount?: boolean;
  discount?: number;
}) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.showDiscount !== undefined && { showDiscount: data.showDiscount }),
        ...(data.discount !== undefined && { discount: data.discount })
      }
    });
    return { success: true, message: 'Cliente actualizado exitosamente.', customer };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return { success: false, message: `Error interno al actualizar el cliente: ${error.message}` };
  }
}
