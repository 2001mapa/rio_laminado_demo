'use server'

import { prisma } from '@/lib/prisma'

export async function bulkUploadInventory(items: any[]) {
  try {
    console.log(`Processing ${items.length} items from CSV...`);
    
    // 1. Identificar referencias existentes ANTES del upsert
    const existingProducts = await prisma.product.findMany({ select: { sku: true } });
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    // 2. Filtrar cuáles de los items entrantes son completamente nuevos
    const newItems = items.filter(item => !existingSkus.has(item.sku));

    // 3. Ejecutar el upsert masivo
    const operations = items.map((item) => {
      const price = parseFloat(item.price?.toString().replace(/[^\d.-]/g, '')) || 0;
      const stock = parseInt(item.stock?.toString(), 10) || 0;
      
      return prisma.product.upsert({
        where: { sku: item.sku },
        update: {
          name: item.name,
          category: item.category,
          price: price,
          stock: stock,
          locationCode: item.locationCode || null,
        },
        create: {
          sku: item.sku,
          name: item.name || 'Sin nombre',
          category: item.category || 'Sin categora',
          price: price,
          stock: stock,
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
  stock: number;
  locationCode?: string;
}) {
  try {
    // Verificar si ya existe
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) {
      return { success: false, message: 'Ya existe un producto con esta referencia (SKU).' };
    }

    await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        category: data.category,
        price: data.price,
        stock: data.stock,
        locationCode: data.locationCode || null,
      }
    });

    return { success: true, message: 'Producto creado exitosamente.' };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, message: 'Error interno al crear el producto.' };
  }
}
