import assert from 'assert';
import Module from 'module';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const originalRequire = (Module as any).prototype.require;

if (!process.env.TEST_DATABASE_URL) {
  console.warn("⚠️ [SKIPPED] Prueba de integración omitida: TEST_DATABASE_URL no está definida. Esta prueba no figura como aprobada.");
  process.exit(0);
}

let parsedDbUrl: URL;
let parsedDirectUrl: URL;

try {
  parsedDbUrl = new URL(process.env.TEST_DATABASE_URL);
  parsedDirectUrl = process.env.TEST_DIRECT_URL ? new URL(process.env.TEST_DIRECT_URL) : parsedDbUrl;
} catch (e) {
  console.error("❌ ERROR: TEST_DATABASE_URL o TEST_DIRECT_URL no son URLs válidas.");
  process.exit(1);
}

const isLoopback = (host: string) => host === 'localhost' || host === '127.0.0.1' || host === '::1';

if (!isLoopback(parsedDbUrl.hostname) || !isLoopback(parsedDirectUrl.hostname)) {
  console.error("❌ ERROR CRÍTICO DE SEGURIDAD: Solo se permite ejecutar pruebas de integración destructivas contra una base de datos local (localhost / 127.0.0.1).");
  console.error("Destino detectado:", parsedDbUrl.hostname);
  process.exit(1);
}

if (parsedDbUrl.pathname !== parsedDirectUrl.pathname) {
  console.error("❌ ERROR: TEST_DATABASE_URL y TEST_DIRECT_URL deben apuntar al mismo destino de base de datos de pruebas local.");
  process.exit(1);
}

const targetSchema = parsedDbUrl.searchParams.get('schema');
if (!targetSchema || !targetSchema.startsWith('test_')) {
  console.error("❌ ERROR: La URL debe incluir explícitamente un schema de pruebas controlado que comience con 'test_' (ej. ?schema=test_idempotency).");
  process.exit(1);
}

const testDbUrl = process.env.TEST_DATABASE_URL;
const testDirectUrl = process.env.TEST_DIRECT_URL || testDbUrl;

// Extraemos explícitamente el esquema de la URL


console.log("==================================================");
console.log(`🚀 PREPARANDO ENTORNO DE INTEGRACIÓN (Schema: ${targetSchema})`);

try {
  // Inicializa la base de datos de pruebas (no usa accept-data-loss para evitar reseteos globales)
  execSync('pnpm exec prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDirectUrl },
    stdio: 'ignore'
  });
} catch (e) {
  console.error("❌ Error inicializando esquema de prueba.", e);
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

// Importar la acción tras los mocks
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
    console.log("\\n[SETUP] Insertando datos base...");
    await testPrisma.seller.create({
       data: { id: 'seller-1', authUserId: 'vendedor-test-auth', name: 'Vendedor Test', email: 'v@test.com', status: 'active' }
    });
    
    await testPrisma.customer.create({
       data: { id: 'cust-1', authUserId: 'cust-1-auth', name: 'Cliente 1', email: 'c1@test.com', status: 'active', showDiscount: false, discount: 0 }
    });

    await testPrisma.product.create({
       data: { id: 'prod-1', sku: 'P1', name: 'Anillo Test', category: 'Anillos', material: 'Oro 18k', physicalStock: 10, reservedStock: 0, price: 100, isActive: true }
    });

    console.log("\\n[TEST] 1. Crear pedido inicial");
    let res = await createOrder({
       customerId: 'cust-1',
       clientRequestId: 'req-abc-123',
       items: [
           { productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] },
           { productId: 'prod-1', quantity: 1, sizeDetails: [{ size: '8', quantity: 1 }] }
       ]
    });
    logAssert(res.success === true, "Pedido creado con éxito");

    console.log("\\n[TEST] 2. Intento con distintas cantidades o tallas rechaza");
    let res2 = await createOrder({
       customerId: 'cust-1',
       clientRequestId: 'req-abc-123',
       items: [
           { productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] },
           { productId: 'prod-1', quantity: 1, sizeDetails: [{ size: '9', quantity: 1 }] } // Talla distinta
       ]
    });
    logAssert(res2.success === false, "Detectada discrepancia en contenido");

    console.log("\\n[TEST] 3. Carrera real concurrente (Promise.all)");
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
    logAssert(prodCheck!.reservedStock === 4, "El stock total reservado es correcto sin duplicaciones.");

  } catch (error) {
    console.error("Test framework error:", error);
    hasErrors = true;
  } finally {
    console.log("\\n🧹 Limpiando esquema de pruebas (seguro)...");
    try {
        // Limpiamos estrictamente el esquema creado, JAMÁS public
        if (targetSchema && targetSchema.startsWith('test_') && targetSchema !== 'public') {
           await testPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${targetSchema}" CASCADE;`);
        }
    } catch(e) {
        console.error("No se pudo limpiar el esquema", e);
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
