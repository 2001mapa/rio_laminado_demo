"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck\nconst assert = require('assert');
const module_1 = __importDefault(require("module"));
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const originalRequire = module_1.default.prototype.require;
// Generate unique schema name for isolation
const schemaName = 'test_schema_' + Date.now();
// Original URLs
const baseDbUrl = process.env.DATABASE_URL || "postgresql://postgres.zrthgldcoweydtyxiscj:Or0.Laminado18k.Supabase@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
const baseDirectUrl = process.env.DIRECT_URL || "postgresql://postgres.zrthgldcoweydtyxiscj:Or0.Laminado18k.Supabase@aws-0-us-west-2.pooler.supabase.com:5432/postgres";
const testDbUrl = baseDbUrl.includes('?') ? baseDbUrl + '&schema=' + schemaName : baseDbUrl + '?schema=' + schemaName;
const testDirectUrl = baseDirectUrl.includes('?') ? baseDirectUrl + '&schema=' + schemaName : baseDirectUrl + '?schema=' + schemaName;
console.log("==================================================");
console.log("🚀 PREPARANDO ENTORNO DE INTEGRACIÓN AISLADO");
console.log("Schema:", schemaName);
// 1. Push schema to the isolated namespace
(0, child_process_1.execSync)('npx prisma db push --accept-data-loss', {
    env: Object.assign(Object.assign({}, process.env), { DATABASE_URL: testDbUrl, DIRECT_URL: testDirectUrl }),
    stdio: 'inherit'
});
// 2. Instantiate isolated Prisma
const testPrisma = new client_1.PrismaClient({
    datasources: { db: { url: testDirectUrl } }
});
// Variables for mock authorization
let mockUserId = 'vendedor-test-auth';
let mockRole = 'vendedor';
let bypassFirstFindUnique = false;
// Proxy findUnique to simulate race conditions
const originalFindUnique = testPrisma.order.findUnique;
// @ts-ignore
testPrisma.order.findUnique = (async function (args) {
    var _a;
    if (bypassFirstFindUnique && ((_a = args.where) === null || _a === void 0 ? void 0 : _a.clientRequestId) === 'req-race-777') {
        bypassFirstFindUnique = false;
        return null; // Simulamos que el SELECT inicial no encontró nada (condición de carrera)
    }
    return await originalFindUnique.apply(testPrisma.order, arguments);
});
// Monkey patch imports to use testPrisma and mock auth
module_1.default.prototype.require = function (path) {
    if (path === '@/utils/auth-helpers') {
        return { requireRole: async () => ({ user: { id: mockUserId }, role: mockRole }) };
    }
    if (path === '@/lib/audit') {
        return { getAuditActor: async () => ({}), logAuditEvent: async () => { } };
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
    console.log("🚀 EJECUTANDO TESTS AUTOMATIZADOS DE INTEGRACIÓN");
    console.log("==================================================");
    let hasErrors = false;
    const logAssert = (condition, msg) => {
        if (condition)
            console.log("  ✅ PASSED: " + msg);
        else {
            console.error("  ❌ FAILED: " + msg);
            hasErrors = true;
        }
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
        const customer2 = await testPrisma.customer.create({
            data: { id: 'cust-2', authUserId: 'cust-2-auth', name: 'Cliente 2', email: 'c2@test.com', status: 'active', showDiscount: false, discount: 0 }
        });
        const product = await testPrisma.product.create({
            data: { id: 'prod-1', sku: 'P1', name: 'Anillo Test', category: 'Anillos', material: 'Oro 18k', physicalStock: 10, reservedStock: 0, price: 100, isActive: true }
        });
        console.log("\\n[TEST] 1. Crear pedido normal con clientRequestId");
        let res = await createOrder({
            customerId: 'cust-1',
            clientRequestId: 'req-abc-123',
            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
        });
        logAssert(res.success === true, "Pedido creado con éxito");
        const firstOrderId = res.order.id;
        // Verificar Stock
        let prodCheck = await testPrisma.product.findUnique({ where: { id: 'prod-1' } });
        logAssert(prodCheck.reservedStock === 2, "Stock reservado = 2");
        console.log("\\n[TEST] 2. Reintento idéntico devuelve el mismo pedido sin duplicar stock");
        let res2 = await createOrder({
            customerId: 'cust-1',
            clientRequestId: 'req-abc-123',
            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
        });
        logAssert(res2.success === true, "Devuelve éxito instantáneamente");
        logAssert(res2.order.id === firstOrderId, "Es exactamente el mismo ID de pedido");
        prodCheck = await testPrisma.product.findUnique({ where: { id: 'prod-1' } });
        logAssert(prodCheck.reservedStock === 2, "El stock reservado SIGUE siendo 2, no 4");
        console.log("\\n[TEST] 3. Intento de reutilizar ID por otro cliente (Colisión Cruzada)");
        let res3 = await createOrder({
            customerId: 'cust-2', // Diferente cliente
            clientRequestId: 'req-abc-123',
            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
        });
        logAssert(res3.success === false, "Falló como se esperaba");
        logAssert(res3.error.includes("colisión"), "El error de colisión evita fuga de datos cruzada: " + res3.error);
        console.log("\\n[TEST] 4. Intento de reutilizar ID con contenido distinto");
        let res4 = await createOrder({
            customerId: 'cust-1',
            clientRequestId: 'req-abc-123',
            items: [{ productId: 'prod-1', quantity: 5, sizeDetails: [{ size: '7', quantity: 5 }] }] // Distinta cantidad
        });
        logAssert(res4.success === false, "Falló por contenido distinto");
        logAssert(res4.error.includes("distinto contenido"), "Error detectó discrepancia: " + res4.error);
        console.log("\\n[TEST] 5. Carrera concurrente de clientRequestId (P2002 Race Condition)");
        // Insertamos directamente en BD para simular que otra transacción nos ganó
        const racedRequestId = 'req-race-777';
        // Creamos el pedido concurrentemente
        const racedOrder = await testPrisma.order.create({
            data: {
                orderNumber: 'VEN-9999',
                clientRequestId: racedRequestId,
                customerId: 'cust-1',
                sellerId: 'seller-1',
                status: 'Reservado',
                totalAmount: 100,
                items: {
                    create: [{ productId: 'prod-1', quantity: 1, priceAtTime: 100, materialSnapshot: 'Oro 18k' }]
                }
            }
        });
        // Simulamos que nuestro proceso no vió el pedido en el check INICIAL
        bypassFirstFindUnique = true;
        // Al intentar crearlo, Prisma tirará P2002 en clientRequestId, y nuestro Catch Loop debería rescatarlo!
        let res5 = await createOrder({
            customerId: 'cust-1',
            clientRequestId: racedRequestId,
            items: [{ productId: 'prod-1', quantity: 1, sizeDetails: [{ size: '7', quantity: 1 }] }]
        });
        logAssert(res5.success === true, "Recuperación de P2002 exitosa");
        if (res5.success) {
            logAssert(res5.order.id === racedOrder.id, "Devolvió el pedido ganador de la carrera");
        }
    }
    catch (error) {
        console.error("Test framework error:", error);
        hasErrors = true;
    }
    // Cleanup
    console.log("\\n🧹 Limpiando esquema de pruebas...");
    await testPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await testPrisma.$disconnect();
    console.log("\\n==================================================");
    if (hasErrors) {
        console.error("❌ ALGUNAS PRUEBAS FALLARON");
        process.exit(1);
    }
    else {
        console.log("✅ TODAS LAS PRUEBAS PASARON");
        process.exit(0);
    }
}
runTests();
