'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { requireRole } from '@/utils/auth-helpers'
import { logAuditEvent, getAuditActor } from '@/lib/audit'

export async function uploadProductPhoto(formData: FormData) {
  try {
    // 1. Validar autorización de seguridad
    await requireRole(['admin']);

    const file = formData.get('file') as File;
    const sku = formData.get('sku') as string;
    const type = formData.get('type') as '1' | '2'; // 1 = main, 2 = hover

    if (!file || !sku || !type) {
      return { success: false, message: 'Faltan datos (archivo, sku o tipo)' };
    }

    // 2. Verificar que el producto existe en Prisma
    const product = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase() }
    });

    if (!product) {
      return { success: false, message: `Producto ${sku} no encontrado en la base de datos.` };
    }

    // 3. Obtener cliente de Supabase (con cookies/sesión del usuario actual)
    const supabase = await createClient();
    const filename = `${sku.toUpperCase()}_${type}.webp`;

    // 4. Subir archivo usando el SDK oficial (envía el JWT del admin automáticamente)
    const { data, error } = await supabase
      .storage
      .from('productos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/webp'
      });

    if (error) {
      console.error(`Error de Supabase al subir ${filename}:`, error);
      if (error.message.includes('Bucket not found')) {
        return { success: false, message: 'El bucket "productos" no existe en Supabase.' };
      }
      if (error.message.includes('row-level security')) {
        return { success: false, message: 'Permiso denegado: Revisa las políticas RLS del bucket "productos".' };
      }
      return { success: false, message: `Error Storage: ${error.message}` };
    }

    // 5. Obtener URL Pública
    const { data: publicUrlData } = supabase.storage.from('productos').getPublicUrl(filename);
    const publicUrl = publicUrlData.publicUrl;

    // 6. Actualizar base de datos
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

    return { success: true, message: `Foto de ${sku} guardada exitosamente.` };
  } catch (error: any) {
    console.error('Error interno en uploadProductPhoto:', error);
    return { success: false, message: error.message || 'Error interno al guardar la foto.' };
  }
}
