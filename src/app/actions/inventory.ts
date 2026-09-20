'use server'

import { prisma } from '@/lib/prisma'

import { requireRole } from '@/utils/auth-helpers'

export async function bulkUploadInventory(items: any[], token?: string) {
  try {
    await requireRole(['admin'], token);
    console.log(`Processing ${items.length} items from CSV...`);
    
    // 1. Identificar referencias existentes ANTES del upsert
    const existingProducts = await prisma.product.findMany({ select: { sku: true } });
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    // 2. Filtrar cuáles de los items entrantes son completamente nuevos
    const newItems = items.filter(item => !existingSkus.has(item.sku));

    // 3. Ejecutar el upsert masivo
    const operations = items.map((item) => {
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\d.-]/g, '')) || 0;
      const physicalStock = parseInt(item.physicalStock?.toString(), 10) || 0;
      
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
          category: item.category || 'Sin categora',
          price: price,
          physicalStock: physicalStock,
          locationCode: item.locationCode || null,
        }
      });
    });

    await prisma.$transaction(operations);
    
    // 4. Retornar éxito y la lista de nuevos productos
    return { 
      success: true, 
      message: `Se actualizaron ${items.length} referencias. Se encontraron ${newItems.length} referencias nuevas.`,
      newProducts: newItems 
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
}, token?: string) {
  try {
    await requireRole(['admin'], token);
    const product = await prisma.product.upsert({
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
      }
    });

    return { success: true, message: 'Producto creado exitosamente.' };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, message: 'Error interno al crear el producto.' };
  }
}

export async function previewCSVUpload(items: any[], token?: string) {
  try {
    await requireRole(['admin'], token);
    const skus = items.map(i => i.sku).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true }
    });
    
    const existingSkus = new Set(existingProducts.map(p => p.sku));
    
    let toCreate = 0;
    let toUpdate = 0;
    let errors: { row: number, error: string }[] = [];
    
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
      
      if (existingSkus.has(item.sku)) {
        toUpdate++;
      } else {
        toCreate++;
      }
    });
    
    return { success: true, toCreate: toCreate, toUpdate: toUpdate, errors: errors };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
