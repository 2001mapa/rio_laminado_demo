import assert from 'assert';
import Module from 'module';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const originalRequire = (Module as any).prototype.require;

if (!process.env.TEST_DATABASE_URL) {
  console.error("❌ ERROR: La prueba de integración requiere TEST_DATABASE_URL explícita.");
  console.error("Ejemplo: TEST_DATABASE_URL='postgresql://...&schema=test_schema' pnpm test");
  process.exit(0); // Exit 0 to skip gracefully instead of breaking generic test runner
}

if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
  console.error("❌ ERROR: TEST_DATABASE_URL no puede ser idéntica a DATABASE_URL de producción.");
  process.exit(1);
}

const testDbUrl = process.env.TEST_DATABASE_URL;
const testDirectUrl = process.env.TEST_DIRECT_URL || testDbUrl;

console.log("==================================================");
console.log("🚀 PREPARANDO ENTORNO DE INTEGRACIÓN (TEST_DATABASE_URL)");

// 1. Push schema to the isolated namespace (Do NOT use --accept-data-loss blindly if not needed, but for a dynamic schema we might need it, however we'll just push normally)
try {
  execSync('pnpm exec prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDirectUrl },
    stdio: 'inherit'
  });
} catch (e) {
  console.error("Error inicializando esquema de prueba.");
  process.exit(1);
}

// 2. Instantiate isolated Prisma
const testPrisma = new PrismaClient({
  datasources: { db: { url: testDbUrl } }
});

// Variables for mock authorization
let mockUserId = 'vendedor-test-auth';
let mockRole = 'vendedor';

// Monkey patch imports to use testPrisma and mock auth
(Module as any).prototype.require = function(path: string) {
  if (path === '@/utils/auth-helpers') {
    return { requireRole: async () => ({ user: { id: mockUserId }, role: mockRole }) };
  }
  if (path === '@/lib/audit') {
    return { getAuditActor: async () => ({}), logAuditEvent: async () => {} };
  }
  if (path === '@/lib/order-status') {
    return {};
  }
  if (path === '@/lib/prisma') {
    return { prisma: testPrisma };
  }
  return originalRequire.apply(this, arguments);
};

// Now import the action AFTER mocking
const { createOrder } = require('../src/app/actions/orders');

async function runTests() {
  console.log("==================================================");
  console.log("🚀 EJECUTANDO TESTS DE IDEMPOTENCIA Y CONCURRENCIA");
  console.log("==================================================");

  let hasErrors = false;
  const logAssert = (condition: boolean, msg: string) => {
    if (condition) console.log("  ✅ PASSED: " + msg);
    else { console.error("  ❌ FAILED: " + msg); hasErrors = true; }
  };

  try {
    // A. SETUP SEED DATA in Isolated Schema
    console.log("\\n[SETUP] Insertando datos base...");
    const seller = await testPrisma.seller.create({
       data: { id: 'seller-1', authUserId: 'vendedor-test-auth', name: 'Vendedor Test', email: 'v@test.com', status: 'active' }
    });
    
    const customer1 = await testPrisma.customer.create({
       data: { id: 'cust-1', authUserId: 'cust-1-auth', name: 'Cliente 1', email: 'c1@test.com', status: 'active', showDiscount: false, discount: 0 }
    });

    const product = await testPrisma.product.create({
       data: { id: 'prod-1', sku: 'P1', name: 'Anillo Test', category: 'Anillos', material: 'Oro 18k', physicalStock: 10, reservedStock: 0, price: 100, isActive: true }
    });

    console.log("\\n[TEST] 1. Crear pedido inicial");
    let res = await createOrder({
       customerId: 'cust-1',
       clientRequestId: 'req-abc-123',
       items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
    });
    logAssert(res.success === true, "Pedido creado con éxito");

    console.log("\\n[TEST] 2. Intento con distintas cantidades rechaza");
    let res2 = await createOrder({
       customerId: 'cust-1',
       clientRequestId: 'req-abc-123',
       items: [{ productId: 'prod-1', quantity: 3, sizeDetails: [{ size: '7', quantity: 3 }] }]
    });
    logAssert(res2.success === false, "Detectado contenido distinto");

    console.log("\\n[TEST] 3. Intento con distintas tallas rechaza");
    let res3 = await createOrder({
       customerId: 'cust-1',
       clientRequestId: 'req-abc-123',
       items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '8', quantity: 2 }] }]
    });
    logAssert(res3.success === false, "Detectada talla distinta");

    console.log("\\n[TEST] 4. Carrera real concurrente (Promise.all)");
    const raceId = 'req-race-888';
    const reqData = {
       customerId: 'cust-1',
       clientRequestId: raceId,
       items: [{ productId: 'prod-1', quantity: 1, sizeDetails: [{ size: '7', quantity: 1 }] }]
    };

    const results = await Promise.all([
       createOrder(reqData),
       createOrder(reqData),
       createOrder(reqData)
    ]);
    
    const successes = results.filter((r: any) => r.success);
    const orderIds = new Set(successes.map((r: any) => r.order.id));

    logAssert(successes.length === 3, "Las 3 solicitudes retornaron éxito");
    logAssert(orderIds.size === 1, "Todas devolvieron exactamente el mismo Order ID de base de datos");

    let prodCheck = await testPrisma.product.findUnique({ where: { id: 'prod-1' } });
    logAssert(prodCheck!.reservedStock === 3, "El stock total es 3 (2 del primero + 1 de la carrera). No hubo reservas duplicadas.");

  } catch (error) {
    console.error("Test framework error:", error);
    hasErrors = true;
  } finally {
    // Cleanup
    console.log("\\n🧹 Limpiando esquema de pruebas...");
    try {
        // Limpiamos las tablas generadas
        await testPrisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    } catch(e) {
        // Fallback for custom schemas
        const schema = testDbUrl.split('schema=')[1];
        if (schema) {
           await testPrisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE;`);
        }
    }
    await testPrisma.$disconnect();
  }

  console.log("\\n==================================================");
  if (hasErrors) {
    console.error("❌ ALGUNAS PRUEBAS FALLARON");
    process.exit(1);
  } else {
    console.log("✅ TODAS LAS PRUEBAS PASARON");
    process.exit(0);
  }
}

runTests();
