'use server'

import { prisma } from '@/lib/prisma'

export async function bulkUploadInventory(items: any[]) {
  try {
    console.log(`Processing ${items.length} items from CSV...`);
    
    // Process items in chunks or sequentially since SQLite Prisma doesn't have an easy native upsertMany
    // Actually, we can use a transaction with multiple upserts
    const operations = items.map((item) => {
      // Ensure numeric fields
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
          imageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?fit=crop&w=600&h=600&q=80', // Default image for new items
        }
      });
    });

    // Execute all upserts in a transaction
    await prisma.$transaction(operations);

    return { success: true, message: `${items.length} referencias actualizadas correctamente.` };
  } catch (error: any) {
    console.error('Error during bulk upload:', error);
    return { success: false, message: 'Ocurrió un error al guardar el inventario en la base de datos.' };
  }
}
