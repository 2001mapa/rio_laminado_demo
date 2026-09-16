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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save locally (Simulating Supabase Storage)
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Name the file securely
    const filename = `${sku}_${type}.webp`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    // The public URL to access this locally
    const publicUrl = `/uploads/${filename}`;

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
