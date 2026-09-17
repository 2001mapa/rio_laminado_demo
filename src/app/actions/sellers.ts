'use server'

import { prisma } from '@/lib/prisma'

export async function createSeller(data: {
  name: string;
  email: string;
}) {
  try {
    const existing = await prisma.seller.findUnique({
      where: { email: data.email }
    });
    
    if (existing) {
      return { success: false, message: 'Ya existe un vendedor con este correo electrónico.' };
    }

    const seller = await prisma.seller.create({
      data: {
        name: data.name,
        email: data.email,
        status: 'active'
      }
    });

    return { 
      success: true, 
      message: 'Vendedor creado exitosamente.',
      seller: seller 
    };
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
  try {
    const existing = await prisma.seller.findUnique({
      where: { email: data.email }
    });
    
    if (existing && existing.id !== id) {
      return { success: false, message: 'El correo electrónico ya está en uso por otro vendedor.' };
    }

    const seller = await prisma.seller.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        status: data.status
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
