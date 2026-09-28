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

    if (products.length === 0) return { success: true, updated: 0 };

    // Bajar lista completa del bucket
    let allFiles: string[] = [];
    let hasMore = true;
    let offset = 0;
    while (hasMore) {
        const { data, error } = await supabase.storage.from('productos').list('', { limit: 1000, offset });
        if (error) break;
        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allFiles.push(...data.map(f => f.name));
            if (data.length < 1000) hasMore = false;
            else offset += 1000;
        }
    }

    const fileSet = new Set(allFiles);
    let updated = 0;
    const updates = [];

    for (const p of products) {
        let changed = false;
        let newImageUrl = p.imageUrl;
        let newHoverImageUrl = p.hoverImageUrl;

        if (!p.imageUrl) {
            const filename = `${p.sku.toUpperCase()}_1.webp`;
            if (fileSet.has(filename)) {
                const { data } = supabase.storage.from('productos').getPublicUrl(filename);
                newImageUrl = data.publicUrl;
                changed = true;
            }
        }

        if (!p.hoverImageUrl) {
            const filename = `${p.sku.toUpperCase()}_2.webp`;
            if (fileSet.has(filename)) {
                const { data } = supabase.storage.from('productos').getPublicUrl(filename);
                newHoverImageUrl = data.publicUrl;
                changed = true;
            }
        }

        if (changed) {
            updates.push(prisma.product.update({
                where: { id: p.id },
                data: { imageUrl: newImageUrl, hoverImageUrl: newHoverImageUrl }
            }));
            updated++;
        }
    }

    if (updates.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < updates.length; i += chunkSize) {
            await prisma.$transaction(updates.slice(i, i + chunkSize));
        }
    }

    return { success: true, updated };
  } catch (error: any) {
    console.error('Error in syncOrphanedPhotos:', error);
    return { success: false, message: error.message };
  }
}
