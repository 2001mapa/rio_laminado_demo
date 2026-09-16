'use server'

import { prisma } from '@/lib/prisma'

export async function bulkUploadInventory(items: any[]) {
  try {
    console.log(`Processing ${items.length} items from CSV...`);
    
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
          category: item.category || 'Sin categoría',
          price: price,
          stock: stock,
          locationCode: item.locationCode || null,
        }
      });
    });

    await prisma.$transaction(operations);
    return { success: true, message: `${items.length} referencias actualizadas correctamente.` };
  } catch (error: any) {
    console.error('Error during bulk upload:', error);
    return { success: false, message: 'Ocurrió un error al guardar el inventario.' };
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
