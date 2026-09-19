'use server'

import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function uploadProductPhoto(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const sku = formData.get('sku') as string;
    const type = formData.get('type') as '1' | '2'; // 1 = main, 2 = hover

    if (!file || !sku || !type) {
      return { success: false, message: 'Faltan datos (archivo, sku o tipo)' };
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase() }
    });

    if (!product) {
      return { success: false, message: `Producto ${sku} no encontrado en la base de datos.` };
    }

    // --- NUEVA LÓGICA PARA SUPABASE STORAGE ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, message: 'Error: Faltan credenciales de Supabase en el archivo .env' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${sku}_${type}.webp`;
    
    // Subir a Supabase Storage (Bucket llamado "productos")
    const uploadUrl = `${supabaseUrl}/storage/v1/object/productos/${filename}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': file.type || 'image/webp',
        'x-upsert': 'true' // Sobrescribir si ya existe una foto vieja
      },
      body: buffer
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error de Supabase:', errorData);
      return { success: false, message: 'Error al subir la imagen. Revisa que el Bucket "productos" exista y sea público.' };
    }

    // La URL pública para acceder a la foto en cualquier parte del mundo
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/productos/${filename}`;

    // Update database
    if (type === '1') {
      await prisma.product.update({
        where: { sku: sku.toUpperCase() },
        data: { imageUrl: publicUrl }
      });
    } else {
      await prisma.product.update({
        where: { sku: sku.toUpperCase() },
        data: { hoverImageUrl: publicUrl }
      });
    }

    return { success: true, message: `Foto de ${sku} guardada.` };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, message: 'Error interno al guardar la foto.' };
  }
}
