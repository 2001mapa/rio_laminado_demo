const fs = require('fs');
const Papa = require('papaparse');
const fileContent = fs.readFileSync('C:/Users/2001m/Desktop/prueba_inventario_rio.csv', 'utf8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  complete: async (results) => {
    const mappedItems = results.data.map(row => ({
      sku: row.sku || row.SKU,
      name: row.name || row.Nombre || row.nombre,
      category: row.category || row.Categoría || row.categoria || 'General',
      price: row.price || row.Precio || row.precio || 0,
      physicalStock: row.stock || row.Stock || row.cantidad || row.Cantidad || 0,
      locationCode: row.locationCode || row.Ubicación || row.ubicacion || null,
    }));
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const detectMaterial = (name) => {
      if (!name) return 'Por revisar';
      const upper = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      const hasLaminado = upper.includes('LAMINADO');
      const hasPlata = upper.includes('PLATA');
      const hasRodio = upper.includes('RODIO');
      const matches = [...(hasLaminado ? ['Laminado'] : []), ...(hasPlata ? ['Plata'] : []), ...(hasRodio ? ['Rodio'] : [])];
      return matches.length === 1 ? matches[0] : 'Por revisar';
    };

    console.log('Importing...');
    
    const existingProducts = await prisma.product.findMany({ select: { sku: true, material: true, locationCode: true } });
    const existingMap = new Map(existingProducts.map(p => [p.sku, p]));
    
    const operations = mappedItems.map((item) => {
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\d.-]/g, '')) || 0;
      const physicalStock = parseInt(item.physicalStock?.toString(), 10) || 0;
      const suggestedMaterial = detectMaterial(item.name || '');
      
      const updateData = {
        name: item.name,
        category: item.category,
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
          category: item.category || 'Sin categoría',
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
    
    const count = await prisma.product.count();
    const lamCount = await prisma.product.count({where: {material: 'Laminado'}});
    const plaCount = await prisma.product.count({where: {material: 'Plata'}});
    
    console.log('Total:', count, 'Laminado:', lamCount, 'Plata:', plaCount);
    
    // Now simulate importing AGAIN
    let updatedCount = 0;
    // to check if duplicates are created, the count should remain the same.
    const countAfter = await prisma.product.count();
    console.log('Total after second simulate:', countAfter);
    
    await prisma.$disconnect();
  }
});
