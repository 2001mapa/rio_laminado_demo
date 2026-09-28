'use server'

import { prisma } from '@/lib/prisma'
import { logAuditEvent, getAuditActor } from '@/lib/audit'
import { requireRole } from '@/utils/auth-helpers'
import { OFFICIAL_PRODUCT_TYPES, normalizeProductType } from '@/lib/constants'

const detectMaterial = (name: string): string => {
  if (!name) return 'Por revisar';
  const upper = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const hasLaminado = upper.includes('LAMINADO');
  const hasPlata = upper.includes('PLATA');
  const hasRodio = upper.includes('RODIO');
  
  const matches = [
    ...(hasLaminado ? ['Laminado'] : []),
    ...(hasPlata ? ['Plata'] : []),
    ...(hasRodio ? ['Rodio'] : []),
  ];
  
  if (matches.length === 1) return matches[0];
  return 'Por revisar';
};

export async function bulkUploadInventory(items: any[]) {
  try {
    await requireRole(['admin']);
    console.log(`Processing ${items.length} items from CSV...`);
    
    const existingProducts = await prisma.product.findMany({ select: { sku: true, material: true, locationCode: true } });
    const existingMap = new Map(existingProducts.map(p => [p.sku, p]));

    let warnings: string[] = [];
    const newItems = items.filter(item => !existingMap.has(item.sku));

    const operations = items.map((item) => {
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\d.-]/g, '')) || 0;
      const physicalStock = parseInt(item.physicalStock?.toString(), 10) || 0;
      
      const suggestedMaterial = detectMaterial(item.name || '');
      const existing = existingMap.get(item.sku);
      
      if (existing) {
         if (existing.material && existing.material !== 'Por revisar' && suggestedMaterial !== 'Por revisar' && existing.material !== suggestedMaterial) {
           warnings.push(`El SKU ${item.sku} ya es '${existing.material}'. Sugiere '${suggestedMaterial}'. (Conservado original)`);
         }
      }
      
      const updateData: any = {
        name: item.name,
        category: normalizeProductType(item.category),
        price: price,
        physicalStock: physicalStock,
      };
      
      if (item.locationCode && item.locationCode.trim() !== '') {
         updateData.locationCode = item.locationCode;
      }
      
      return prisma.product.upsert({
        where: { sku: item.sku },
        update: updateData,
        create: {
          sku: item.sku,
          name: item.name || 'Sin nombre',
          category: normalizeProductType(item.category) || 'Sin categoría',
          price: price,
          physicalStock: physicalStock,
          locationCode: (item.locationCode && item.locationCode.trim() !== '') ? item.locationCode : null,
          material: suggestedMaterial,
          reservedStock: 0,
          isActive: true
        }
      });
    });

    
    await prisma.$transaction(operations);

    try {
      const actor = await getAuditActor();
      await logAuditEvent(actor, {
        action: 'BULK_UPLOAD',
        entityType: 'PRODUCT',
        entityId: 'multiple',
        origin: 'admin_dashboard',
        result: 'success',
        changes: {
          totalProcessed: items.length,
          newProducts: newItems.length,
          updatedProducts: items.length - newItems.length,
          warnings: warnings.length
        }
      });
    } catch (auditErr) {
      console.error('Failed to log audit for bulk upload:', auditErr);
    }

      return { 
      success: true, 
      message: `Se actualizaron ${items.length} referencias. Se encontraron ${newItems.length} referencias nuevas.`,
      newProducts: newItems,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error: any) {
    console.error('Error during bulk upload:', error);
    const actor = await getAuditActor().catch(() => ({ id: 'unknown', name: 'Unknown', role: 'admin' as any }));
      await logAuditEvent(actor, {
        action: 'BULK_UPLOAD',
        entityType: 'PRODUCT',
        entityId: 'multiple',
        origin: 'admin_dashboard',
        result: 'error',
        changes: { error: error.message }
      });
      return { success: false, message: `Ocurrió un error al guardar el inventario: ${error.message}` };
  }
}

export async function createSingleProduct(data: {
  sku: string;
  name: string;
  category: string;
  price: number;
  physicalStock: number;
  locationCode?: string;
  material?: string;
}) {
  try {
    await requireRole(['admin']);
    
    const suggestedMaterial = data.material || detectMaterial(data.name);

    await prisma.product.upsert({
      where: { sku: data.sku },
      update: {
        name: data.name,
        category: normalizeProductType(data.category),
        price: data.price,
        physicalStock: data.physicalStock,
        isActive: true,
        locationCode: data.locationCode || null,
      },
      create: {
        sku: data.sku,
        name: data.name,
        category: normalizeProductType(data.category),
        price: data.price,
        physicalStock: data.physicalStock,
        reservedStock: 0,
        isActive: true,
        locationCode: data.locationCode || null,
        material: suggestedMaterial
      }
    });

    return { success: true, message: 'Producto creado exitosamente.' };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, message: 'Error interno al crear el producto.' };
  }
}

export async function updateProductAction(id: string, data: {
  sku?: string;
  name?: string;
  category?: string;
  price?: number;
  physicalStock?: number;
  locationCode?: string | null;
  material?: string;
  isActive?: boolean;
}) {
  try {
    const actor = await getAuditActor();
    if (actor.role !== 'admin') throw new Error('No autorizado');
    
    const before = await prisma.product.findUnique({ where: { id } });
    if (!before) throw new Error('Producto no encontrado');

    if (data.sku) {
       const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
       if (existing && existing.id !== id) {
          throw new Error('El SKU ya está en uso por otro producto.');
       }
    }
    
    const after = await prisma.product.update({
      where: { id },
      data: {
        ...(data.sku && { sku: data.sku }),
        ...(data.name && { name: data.name }),
        ...(data.category && { category: normalizeProductType(data.category) }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.physicalStock !== undefined && { physicalStock: data.physicalStock }),
        ...(data.locationCode !== undefined && { locationCode: data.locationCode }),
        ...(data.material && { material: data.material }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });

    await logAuditEvent(actor, {
      action: 'UPDATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: id,
      sku: after.sku,
      origin: 'admin_dashboard',
      changes: { before, after }
    });

    return { success: true, message: 'Producto actualizado exitosamente.' };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, message: error.message || 'Error interno al actualizar el producto.' };
  }
}

export async function previewCSVUpload(items: any[]) {
  try {
    await requireRole(['admin']);
    const skus = items.map(i => i.sku).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, material: true, locationCode: true }
    });
    
    const existingMap = new Map(existingProducts.map(p => [p.sku, p]));
    
    let toCreate = 0;
    let toUpdate = 0;
    let errors: { row: number, error: string }[] = [];
    let warnings: string[] = [];
    const csvLocations = new Map<string, string[]>();
    
    let stats = {
       laminado: 0,
       plata: 0,
       rodio: 0,
       revisar: 0
    };
    
    let samples: { sku: string, name: string, material: string }[] = [];
    
    items.forEach((item, index) => {
      const rowNum = index + 2;
      
      if (!item.sku) {
        errors.push({ row: rowNum, error: 'Falta SKU' });
        return;
      }
      
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
      if (isNaN(price)) {
        errors.push({ row: rowNum, error: 'Precio inválido' });
        return;
      }
      
      const physicalStockStr = item.physicalStock ? item.physicalStock.toString() : '0';
      const physicalStock = parseInt(physicalStockStr, 10);
      if (isNaN(physicalStock) || physicalStock < 0) {
        errors.push({ row: rowNum, error: 'Stock inválido' });
        return;
      }
      
      const normalizedCategory = normalizeProductType(item.category || '');
      if (!OFFICIAL_PRODUCT_TYPES.includes(normalizedCategory)) {
        errors.push({ row: rowNum, error: `Tipo de producto inválido: "${item.category}". Tipos válidos: ${OFFICIAL_PRODUCT_TYPES.join(', ')}` });
        return;
      }
      
      const suggestedMaterial = detectMaterial(item.name || '');
      
      if (existingMap.has(item.sku)) {
        toUpdate++;
      } else {
        toCreate++;
        if (suggestedMaterial === 'Laminado') stats.laminado++;
        else if (suggestedMaterial === 'Plata') stats.plata++;
        else if (suggestedMaterial === 'Rodio') stats.rodio++;
        else stats.revisar++;
        
        if (samples.length < 5) {
           samples.push({ sku: item.sku, name: item.name, material: suggestedMaterial });
        }
      }

      if (item.locationCode && typeof item.locationCode === 'string' && item.locationCode.trim() !== '') {
          const loc = item.locationCode.trim();
          if (!csvLocations.has(loc)) csvLocations.set(loc, []);
          csvLocations.get(loc)!.push(item.sku);
      }
    });

    const duplicateLocationsInCsv = Array.from(csvLocations.entries()).filter(([loc, skus]) => skus.length > 1);
    if (duplicateLocationsInCsv.length > 0) {
       warnings.push(`El archivo CSV contiene ${duplicateLocationsInCsv.length} ubicación(es) asignadas a múltiples productos (ej. "${duplicateLocationsInCsv[0][0]}").`);
    }

    const activeLocationsInCsv = Array.from(csvLocations.keys());
    if (activeLocationsInCsv.length > 0) {
       const dbConflicts = await prisma.product.findMany({
          where: {
             locationCode: { in: activeLocationsInCsv },
             sku: { notIn: skus }
          },
          select: { locationCode: true, sku: true }
       });
       if (dbConflicts.length > 0) {
          warnings.push(`Hay ${dbConflicts.length} producto(s) en el CSV cuya ubicación ya está ocupada por OTRA referencia en el sistema (ej. "${dbConflicts[0].locationCode}").`);
       }
    }

    // DUPLICATE REFERENCES (SKUS) WARNING:
    const csvSkus = new Set<string>();
    let duplicateSkusCount = 0;
    let sampleDupSku = '';
    items.forEach(item => {
        if (item.sku) {
            if (csvSkus.has(item.sku)) {
                duplicateSkusCount++;
                if (!sampleDupSku) sampleDupSku = item.sku;
            } else {
                csvSkus.add(item.sku);
            }
        }
    });

    if (duplicateSkusCount > 0) {
        warnings.push(`El archivo CSV contiene ${duplicateSkusCount} fila(s) con un SKU repetido (ej. "${sampleDupSku}"). Se guardará solo la última fila leída.`);
    }
    
    return { 
      success: true, 
      toCreate, 
      toUpdate, 
      errors,
      warnings,
      stats,
      samples,
      message: undefined 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
