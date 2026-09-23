'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/utils/auth-helpers'

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
    
    // 1. Identificar referencias existentes ANTES del upsert
    const existingProducts = await prisma.product.findMany({ select: { sku: true, material: true } });
    const existingMap = new Map(existingProducts.map(p => [p.sku, p.material]));

    let warnings: string[] = [];

    // 2. Filtrar cuáles de los items entrantes son completamente nuevos
    const newItems = items.filter(item => !existingMap.has(item.sku));

    // 3. Ejecutar el upsert masivo
    const operations = items.map((item) => {
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\d.-]/g, '')) || 0;
      const physicalStock = parseInt(item.physicalStock?.toString(), 10) || 0;
      
      const suggestedMaterial = detectMaterial(item.name || '');
      const existingMaterial = existingMap.get(item.sku);
      
      if (existingMaterial && existingMaterial !== 'Por revisar' && suggestedMaterial !== 'Por revisar' && existingMaterial !== suggestedMaterial) {
        warnings.push(`Advertencia: El SKU ${item.sku} tiene material '${existingMaterial}' pero su nuevo nombre sugiere '${suggestedMaterial}'. Conservado el original.`);
      }
      
      return prisma.product.upsert({
        where: { sku: item.sku },
        update: {
          name: item.name,
          category: item.category,
          price: price,
          physicalStock: physicalStock,
          locationCode: item.locationCode || null,
        },
        create: {
          sku: item.sku,
          name: item.name || 'Sin nombre',
          category: item.category || 'Sin categoria',
          price: price,
          physicalStock: physicalStock,
          locationCode: item.locationCode || null,
          material: suggestedMaterial
        }
      });
    });

    await prisma.$transaction(operations);
    
    // 4. Retornar éxito y la lista de nuevos productos
    return { 
      success: true, 
      message: `Se actualizaron ${items.length} referencias. Se encontraron ${newItems.length} referencias nuevas.`,
      newProducts: newItems,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error: any) {
    console.error('Error during bulk upload:', error);
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
        category: data.category,
        price: data.price,
        physicalStock: data.physicalStock,
        isActive: true,
        locationCode: data.locationCode || null,
      },
      create: {
        sku: data.sku,
        name: data.name,
        category: data.category,
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

export async function previewCSVUpload(items: any[]) {
  console.log(`[previewCSVUpload] Action triggered with ${items?.length} items`);
  try {
    const { user } = await requireRole(['admin']);
    console.log(`[previewCSVUpload] Authorized as: ${user.id}`);
    const skus = items.map(i => i.sku).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, material: true }
    });
    
    const existingMap = new Map(existingProducts.map(p => [p.sku, p.material]));
    
    let toCreate = 0;
    let toUpdate = 0;
    let errors: { row: number, error: string }[] = [];
    let materialIssues = 0;
    
    items.forEach((item, index) => {
      if (!item.sku) {
        errors.push({ row: index + 2, error: 'Falta SKU' });
        return;
      }
      
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
      if (isNaN(price)) {
        errors.push({ row: index + 2, error: 'Precio inválido' });
        return;
      }
      
      const suggestedMaterial = detectMaterial(item.name || '');
      
      if (existingMap.has(item.sku)) {
        toUpdate++;
      } else {
        toCreate++;
        if (suggestedMaterial === 'Por revisar') {
           materialIssues++;
        }
      }
    });
    
    return { 
      success: true, 
      toCreate, 
      toUpdate, 
      errors, 
      materialIssues,
      message: materialIssues > 0 ? "Hay productos nuevos sin material definido. Se marcarán como Por revisar." : undefined 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
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
    await requireRole(['admin']);
    
    // Check if new sku is already used
    if (data.sku) {
       const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
       if (existing && existing.id !== id) {
          throw new Error('El SKU ya está en uso por otro producto.');
       }
    }
    
    await prisma.product.update({
      where: { id },
      data: {
        ...(data.sku && { sku: data.sku }),
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.physicalStock !== undefined && { physicalStock: data.physicalStock }),
        ...(data.locationCode !== undefined && { locationCode: data.locationCode }),
        ...(data.material && { material: data.material }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });

    return { success: true, message: 'Producto actualizado exitosamente.' };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, message: error.message || 'Error interno al actualizar el producto.' };
  }
}
