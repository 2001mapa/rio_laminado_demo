'use server'

import { prisma } from '@/lib/prisma'

export async function createCustomer(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  discount: number;
  showDiscount: boolean;
}) {
  try {
    // Si envían un email, verificamos que no exista
    if (data.email) {
      const existing = await prisma.customer.findUnique({
        where: { email: data.email }
      });
      if (existing) {
        return { success: false, message: 'Ya existe un cliente con este correo electrónico.' };
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
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
    return { success: false, message: 'Error interno al crear el cliente.' };
  }
}
