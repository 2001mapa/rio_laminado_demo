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
      
      const actor = await getAuditActor().catch(() => ({ id: 'unknown', name: 'Unknown', role: 'system' as any }));
      await logAuditEvent(actor, {
        action: 'UPLOAD_PHOTO',
        entityType: 'PHOTO',
        entityId: product.id,
        sku: product.sku,
        origin: 'admin_dashboard',
        result: 'error',
        changes: { error: error.message }
      });
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

    
    const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: 'UPLOAD_PHOTO',
      entityType: 'PHOTO',
      entityId: product.id,
      sku: product.sku,
      origin: 'admin_dashboard',
      result: 'success',
      changes: {
        type: type === '1' ? 'Foto Principal' : 'Foto Hover',
        filename,
        publicUrl
      }
    });

    return { success: true, message: `Foto de ${sku} guardada exitosamente.` };

  } catch (error: any) {
    console.error('Error interno en uploadProductPhoto:', error);
    return { success: false, message: error.message || 'Error interno al guardar la foto.' };
  }
}

export async function syncOrphanedPhotos() {
  try {
    await requireRole(['admin']);
    const supabase = await createClient();
    
    // Obtener productos sin foto principal o sin foto secundaria
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { hoverImageUrl: null }
        ]
      }
    });

    let updated = 0;
    
    // Check in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (p) => {
        let changed = false;
        let newImageUrl = p.imageUrl;
        let newHoverImageUrl = p.hoverImageUrl;

        // Comprobar foto 1
        if (!p.imageUrl) {
          const filename = `${p.sku.toUpperCase()}_1.webp`;
          const { data } = supabase.storage.from('productos').getPublicUrl(filename);
          try {
            const res = await fetch(data.publicUrl, { method: 'HEAD' });
            if (res.ok) {
              newImageUrl = data.publicUrl;
              changed = true;
            }
          } catch (e) {
            // Ignorar
          }
        }

        // Comprobar foto 2
        if (!p.hoverImageUrl) {
          const filename = `${p.sku.toUpperCase()}_2.webp`;
          const { data } = supabase.storage.from('productos').getPublicUrl(filename);
          try {
            const res = await fetch(data.publicUrl, { method: 'HEAD' });
            if (res.ok) {
              newHoverImageUrl = data.publicUrl;
              changed = true;
            }
          } catch (e) {
            // Ignorar
          }
        }

        if (changed) {
          await prisma.product.update({
            where: { id: p.id },
            data: { imageUrl: newImageUrl, hoverImageUrl: newHoverImageUrl }
          });
          updated++;
        }
      }));
    }

    return { success: true, updated };
  } catch (error: any) {
    console.error('Error in syncOrphanedPhotos:', error);
    return { success: false, message: error.message };
  }
}
