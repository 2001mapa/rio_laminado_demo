"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Pruebas Automatizadas de Autorización
const assert = require('assert');
// Mock dependencias
const module_1 = __importDefault(require("module"));
const originalRequire = module_1.default.prototype.require;
global.mockUserRole = 'vendedor';
global.mockUserStatus = 'suspended';
module_1.default.prototype.require = function (path) {
    if (path === '@/utils/supabase/server') {
        return {
            createClient: async () => ({
                auth: {
                    getUser: async () => ({ data: { user: { id: 'test-user-id', app_metadata: { role: global.mockUserRole } } }, error: null })
                }
            })
        };
    }
    if (path === '@/lib/prisma') {
        return {
            prisma: {
                seller: {
                    findUnique: async () => {
                        if (global.mockUserRole === 'vendedor')
                            return { status: global.mockUserStatus };
                        return null;
                    }
                },
                customer: {
                    findUnique: async () => {
                        if (global.mockUserRole === 'cliente')
                            return { status: global.mockUserStatus };
                        return null;
                    }
                }
            }
        };
    }
    return originalRequire.apply(this, arguments);
};
const { requireRole, getSessionUser } = require('../src/utils/auth-helpers');
async function runAuthTests() {
    console.log("==================================================");
    console.log("🚀 EJECUTANDO TESTS AUTOMATIZADOS: AUTORIZACIÓN");
    console.log("==================================================");
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
        console.log("\\n[TEST] Vendedor suspendido es rechazado por requireRole");
        global.mockUserRole = 'vendedor';
        global.mockUserStatus = 'suspended';
        let threw = false;
        try {
            await requireRole(['vendedor']);
        }
        catch (e) {
            threw = true;
            logAssert(e.message.includes("cuenta ha sido suspendida"), "Excepción correcta: " + e.message);
        }
        logAssert(threw, "requireRole debe lanzar excepción si el vendedor está suspendido.");
        console.log("\\n[TEST] Vendedor activo es aceptado por requireRole");
        global.mockUserRole = 'vendedor';
        global.mockUserStatus = 'active';
        threw = false;
        try {
            const { role } = await requireRole(['vendedor']);
            logAssert(role === 'vendedor', "Rol retornado correctamente.");
        }
        catch (e) {
            threw = true;
        }
        logAssert(!threw, "requireRole NO debe lanzar excepción si el vendedor está activo.");
        console.log("\\n[TEST] getSessionUser resuelve estado dinámico");
        global.mockUserRole = 'vendedor';
        global.mockUserStatus = 'suspended';
        const session = await getSessionUser();
        logAssert(session.status === 'suspended', "getSessionUser detectó estado suspendido desde la BD.");
    }
    catch (error) {
        console.error("Test framework error:", error);
        hasErrors = true;
    }
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
runAuthTests();
