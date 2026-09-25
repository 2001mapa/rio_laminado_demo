const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('--- Iniciando prueba de conexión Prisma ---');
  try {
    // 1. Lectura
    const startTimeRead = Date.now();
    const count = await prisma.product.count();
    console.log(`Lectura exitosa. Tiempo: ${Date.now() - startTimeRead}ms. Productos totales: ${count}`);

    // 2. Escritura (Segura)
    const startTimeWrite = Date.now();
    const testSku = 'TEST-CONN-' + Date.now();
    const product = await prisma.product.create({
      data: {
        sku: testSku,
        name: 'Test Product',
        category: 'Test',
        price: 0,
        isActive: false
      }
    });
    console.log(`Escritura exitosa (Crear). Tiempo: ${Date.now() - startTimeWrite}ms. ID: ${product.id}`);

    const startTimeDelete = Date.now();
    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log(`Escritura exitosa (Eliminar). Tiempo: ${Date.now() - startTimeDelete}ms`);
    
    console.log('--- Pruebas finalizadas con éxito ---');
  } catch (error) {
    console.error('Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
