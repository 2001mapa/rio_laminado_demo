"use strict";
// Pruebas Automatizadas de Vendedores (Mocks Locales)
// Ejecución recomendada: npx tsx __tests__/test-sellers.ts
// Este script NO utiliza credenciales reales ni base de datos de producción.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require('assert');
// Configuramos variables de entorno simuladas para evitar errores de instanciación
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';
// Mocks globales
global.SIMULATE_AUTH_CREATE_ERROR = false;
global.SIMULATE_AUTH_UPDATE_ERROR = false;
global.SIMULATE_AUTH_DELETE_ERROR = false;
global.SIMULATE_PRISMA_CREATE_ERROR = false;
global.SIMULATE_PRISMA_UPDATE_ERROR = false;
global.SIMULATE_PRISMA_TRANSACTION_ERROR = false;
global.SIMULATE_AUDIT_ERROR = false;
// Monkey patch del sistema de módulos de Node.js para interceptar las dependencias reales
const module_1 = __importDefault(require("module"));
const originalRequire = module_1.default.prototype.require;
module_1.default.prototype.require = function (path) {
    if (path === '@/utils/auth-helpers') {
        return { requireRole: async () => ({ user: { id: 'admin123' }, role: 'admin' }) };
    }
    if (path === '@/lib/audit') {
        return {
            getAuditActor: async () => ({ actorId: 'admin123', actorRole: 'admin', actorName: 'Admin' }),
            logAuditEvent: async (actor, event, tx) => {
                if (global.SIMULATE_AUDIT_ERROR)
                    throw new Error("Audit log simulation error");
            }
        };
    }
    if (path === '@/lib/prisma') {
        return { prisma: global.mockPrisma };
    }
    if (path === '@supabase/supabase-js') {
        return {
            createClient: () => ({
                auth: {
                    admin: {
                        createUser: async () => {
                            if (global.SIMULATE_AUTH_CREATE_ERROR)
                                throw new Error("Excepción Auth Create");
                            return { data: { user: { id: 'new-auth-id' } }, error: null };
                        },
                        updateUserById: async () => {
                            if (global.SIMULATE_AUTH_UPDATE_COMPENSATION_ERROR && global.mockUpdateCallCount === 1)
                                throw new Error("Excepción Auth Update Reversión");
                            global.mockUpdateCallCount = (global.mockUpdateCallCount || 0) + 1;
                            if (global.SIMULATE_AUTH_UPDATE_ERROR)
                                throw new Error("Excepción Auth Update");
                            return { data: { user: { id: 'update-auth-id' } }, error: null };
                        },
                        deleteUser: async () => {
                            if (global.SIMULATE_AUTH_DELETE_ERROR)
                                throw new Error("Excepción Auth Delete");
                            return { data: { user: { id: 'deleted-auth-id' } }, error: null };
                        }
                    }
                }
            })
        };
    }
    return originalRequire.apply(this, arguments);
};
// Mock de Prisma Database
global.mockPrisma = {
    seller: {
        findUnique: async ({ where }) => {
            if (where.email === 'existe@test.com')
                return { id: 'seller-exist', email: 'existe@test.com', authUserId: 'auth-exist', name: 'Existe', status: 'active' };
            if (where.id === 'seller-exist')
                return { id: 'seller-exist', email: 'existe@test.com', authUserId: 'auth-exist', name: 'Existe', status: 'active' };
            if (where.id === 'no-auth')
                return { id: 'no-auth', email: 'no@auth.com', authUserId: null, name: 'No Auth', status: 'active' };
            return null;
        },
        create: async (data) => {
            if (global.SIMULATE_PRISMA_CREATE_ERROR)
                throw new Error("Prisma Create Error Simulation");
            return Object.assign({ id: 'new-seller-id' }, data.data);
        },
        update: async (data) => {
            if (global.SIMULATE_PRISMA_UPDATE_ERROR)
                throw new Error("Prisma Update Error Simulation");
            return Object.assign({ id: data.where.id }, data.data);
        }
    },
    $transaction: async (fn) => {
        if (global.SIMULATE_PRISMA_TRANSACTION_ERROR)
            throw new Error("Prisma Transaction Error Simulation");
        return await fn(global.mockPrisma);
    }
};
// Importamos la acción solo después de haber inyectado los mocks
const { createSeller, updateSeller } = require('../src/app/actions/sellers');
async function runTests() {
    console.log("==================================================");
    console.log("🚀 EJECUTANDO TESTS AUTOMATIZADOS: FLUJO VENDEDORES");
    console.log("==================================================");
    const resetMocks = () => {
        global.SIMULATE_AUTH_CREATE_ERROR = false;
        global.SIMULATE_AUTH_UPDATE_ERROR = false;
        global.SIMULATE_AUTH_DELETE_ERROR = false;
        global.SIMULATE_PRISMA_CREATE_ERROR = false;
        global.SIMULATE_PRISMA_UPDATE_ERROR = false;
        global.SIMULATE_PRISMA_TRANSACTION_ERROR = false;
        global.SIMULATE_AUDIT_ERROR = false;
    };
    const testTitle = (title) => console.log("\n[TEST] " + title);
    let hasErrors = false;
    const logAssert = (condition, msg) => {
        if (condition) {
            console.log("  ✅ PASSED: " + msg);
        }
        else {
            console.error("  ❌ FAILED: " + msg);
            hasErrors = true;
        }
    };
    try {
        // TEST 1
        testTitle("Validación de datos vacíos en updateSeller");
        resetMocks();
        let res = await updateSeller('seller-exist', { name: '  ', email: 'invalido', status: 'invalid-status' });
        logAssert(res.success === false && res.message.includes("obligatorio"), res.message);
        // TEST 2
        testTitle("updateSeller - Rechazo por falta de authUserId en la BD");
        resetMocks();
        res = await updateSeller('no-auth', { name: 'Nombre', email: 'valid@test.com', status: 'active' });
        logAssert(res.success === false && res.message.includes("authUserId"), res.message);
        // TEST 3
        testTitle("createSeller - Falla Auth por Excepción");
        resetMocks();
        global.SIMULATE_AUTH_CREATE_ERROR = true;
        res = await createSeller({ name: 'Nuevo', email: 'nuevo@test.com' });
        logAssert(res.success === false && (res.message.includes("hubo un error") || res.message.includes("Error interno al crear")), res.message);
        // TEST 4
        testTitle("createSeller - Falla BD/Transacción con Compensación (Rollback) Exitosa");
        resetMocks();
        global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
        res = await createSeller({ name: 'Nuevo', email: 'nuevo@test.com' });
        logAssert(res.success === false && res.message.includes("cuenta de auth revertida exitosamente"), res.message);
        // TEST 5
        testTitle("createSeller - Falla BD/Transacción con Compensación Fallida (Posible Inconsistencia)");
        resetMocks();
        global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
        global.SIMULATE_AUTH_DELETE_ERROR = true;
        res = await createSeller({ name: 'Nuevo', email: 'nuevo@test.com' });
        logAssert(res.success === false && res.message.includes("Posible inconsistencia"), res.message);
        // TEST 6
        testTitle("updateSeller - Falla Auth por Excepción al inicio (Abortado sin tocar Prisma)");
        resetMocks();
        global.SIMULATE_AUTH_UPDATE_ERROR = true;
        res = await updateSeller('seller-exist', { name: 'New Name', email: 'new@test.com', status: 'suspended' });
        logAssert(res.success === false && res.message.includes("Excepción de Auth, actualización cancelada"), res.message);
        // TEST 7
        testTitle("updateSeller - Falla BD/Transacción con Compensación (Rollback) Exitosa");
        resetMocks();
        global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
        res = await updateSeller('seller-exist', { name: 'New Name', email: 'new@test.com', status: 'suspended' });
        logAssert(res.success === false && res.message.includes("cambios de Auth revertidos exitosamente"), res.message);
        // TEST 8
        testTitle("updateSeller - Falla BD/Transacción con Compensación Fallida (Inconsistencia detectada)");
        resetMocks();
        global.mockUpdateCallCount = 0;
        global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
        global.SIMULATE_AUTH_UPDATE_COMPENSATION_ERROR = true;
        res = await updateSeller('seller-exist', { name: 'New Name', email: 'new@test.com', status: 'suspended' });
        logAssert(res.success === false && res.message.includes("Inconsistencia detectada"), res.message);
    }
    catch (error) {
        console.error("Test framework error:", error);
    }
    console.log("\n==================================================");
    console.log("✅ FIN DE PRUEBAS AUTOMATIZADAS");
    console.log("==================================================");
    if (hasErrors) {
        console.error("\n❌ ALGUNAS PRUEBAS FALLARON");
        process.exit(1);
    }
    else {
        console.log("\n✅ TODAS LAS PRUEBAS PASARON");
        process.exit(0);
    }
}
runTests();
