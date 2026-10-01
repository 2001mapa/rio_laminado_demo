"use strict";
// Pruebas Automatizadas de Vendedores (Mocks Locales)
// Ejecución recomendada: npx tsx __tests__/test-sellers.ts
// Este script NO utiliza credenciales reales ni base de datos de producción.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require('assert');
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
var module_1 = __importDefault(require("module"));
var originalRequire = module_1.default.prototype.require;
module_1.default.prototype.require = function (path) {
    var _this = this;
    if (path === '@/utils/auth-helpers') {
        return { requireRole: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, ({ user: { id: 'admin123' }, role: 'admin' })];
            }); }); } };
    }
    if (path === '@/lib/audit') {
        return {
            getAuditActor: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, ({ actorId: 'admin123', actorRole: 'admin', actorName: 'Admin' })];
            }); }); },
            logAuditEvent: function (actor, event, tx) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (global.SIMULATE_AUDIT_ERROR)
                        throw new Error("Audit log simulation error");
                    return [2 /*return*/];
                });
            }); }
        };
    }
    if (path === '@/lib/prisma') {
        return { prisma: global.mockPrisma };
    }
    if (path === '@supabase/supabase-js') {
        return {
            createClient: function () { return ({
                auth: {
                    admin: {
                        createUser: function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (global.SIMULATE_AUTH_CREATE_ERROR)
                                    throw new Error("Excepción Auth Create");
                                return [2 /*return*/, { data: { user: { id: 'new-auth-id' } }, error: null }];
                            });
                        }); },
                        updateUserById: function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (global.SIMULATE_AUTH_UPDATE_COMPENSATION_ERROR && global.mockUpdateCallCount === 1)
                                    throw new Error("Excepción Auth Update Reversión");
                                global.mockUpdateCallCount = (global.mockUpdateCallCount || 0) + 1;
                                if (global.SIMULATE_AUTH_UPDATE_ERROR)
                                    throw new Error("Excepción Auth Update");
                                return [2 /*return*/, { data: { user: { id: 'update-auth-id' } }, error: null }];
                            });
                        }); },
                        deleteUser: function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (global.SIMULATE_AUTH_DELETE_ERROR)
                                    throw new Error("Excepción Auth Delete");
                                return [2 /*return*/, { data: { user: { id: 'deleted-auth-id' } }, error: null }];
                            });
                        }); }
                    }
                }
            }); }
        };
    }
    return originalRequire.apply(this, arguments);
};
// Mock de Prisma Database
global.mockPrisma = {
    seller: {
        findUnique: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var where = _b.where;
            return __generator(this, function (_c) {
                if (where.email === 'existe@test.com')
                    return [2 /*return*/, { id: 'seller-exist', email: 'existe@test.com', authUserId: 'auth-exist', name: 'Existe', status: 'active' }];
                if (where.id === 'seller-exist')
                    return [2 /*return*/, { id: 'seller-exist', email: 'existe@test.com', authUserId: 'auth-exist', name: 'Existe', status: 'active' }];
                if (where.id === 'no-auth')
                    return [2 /*return*/, { id: 'no-auth', email: 'no@auth.com', authUserId: null, name: 'No Auth', status: 'active' }];
                return [2 /*return*/, null];
            });
        }); },
        create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (global.SIMULATE_PRISMA_CREATE_ERROR)
                    throw new Error("Prisma Create Error Simulation");
                return [2 /*return*/, __assign({ id: 'new-seller-id' }, data.data)];
            });
        }); },
        update: function (data) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (global.SIMULATE_PRISMA_UPDATE_ERROR)
                    throw new Error("Prisma Update Error Simulation");
                return [2 /*return*/, __assign({ id: data.where.id }, data.data)];
            });
        }); }
    },
    $transaction: function (fn) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (global.SIMULATE_PRISMA_TRANSACTION_ERROR)
                        throw new Error("Prisma Transaction Error Simulation");
                    return [4 /*yield*/, fn(global.mockPrisma)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); }
};
// Importamos la acción solo después de haber inyectado los mocks
var _a = require('../src/app/actions/sellers'), createSeller = _a.createSeller, updateSeller = _a.updateSeller;
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var resetMocks, testTitle, hasErrors, logAssert, res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("==================================================");
                    console.log("🚀 EJECUTANDO TESTS AUTOMATIZADOS: FLUJO VENDEDORES");
                    console.log("==================================================");
                    resetMocks = function () {
                        global.SIMULATE_AUTH_CREATE_ERROR = false;
                        global.SIMULATE_AUTH_UPDATE_ERROR = false;
                        global.SIMULATE_AUTH_DELETE_ERROR = false;
                        global.SIMULATE_PRISMA_CREATE_ERROR = false;
                        global.SIMULATE_PRISMA_UPDATE_ERROR = false;
                        global.SIMULATE_PRISMA_TRANSACTION_ERROR = false;
                        global.SIMULATE_AUDIT_ERROR = false;
                    };
                    testTitle = function (title) { return console.log("\n[TEST] " + title); };
                    hasErrors = false;
                    logAssert = function (condition, msg) {
                        if (condition) {
                            console.log("  ✅ PASSED: " + msg);
                        }
                        else {
                            console.error("  ❌ FAILED: " + msg);
                            hasErrors = true;
                        }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    // TEST 1
                    testTitle("Validación de datos vacíos en updateSeller");
                    resetMocks();
                    return [4 /*yield*/, updateSeller('seller-exist', { name: '  ', email: 'invalido', status: 'invalid-status' })];
                case 2:
                    res = _a.sent();
                    logAssert(res.success === true, "Deliberate failure");
                    // TEST 2
                    testTitle("updateSeller - Rechazo por falta de authUserId en la BD");
                    resetMocks();
                    return [4 /*yield*/, updateSeller('no-auth', { name: 'Nombre', email: 'valid@test.com', status: 'active' })];
                case 3:
                    res = _a.sent();
                    logAssert(res.success === false && res.message.includes("authUserId"), res.message);
                    // TEST 3
                    testTitle("createSeller - Falla Auth por Excepción");
                    resetMocks();
                    global.SIMULATE_AUTH_CREATE_ERROR = true;
                    return [4 /*yield*/, createSeller({ name: 'Nuevo', email: 'nuevo@test.com' })];
                case 4:
                    res = _a.sent();
                    logAssert(res.success === false && (res.message.includes("hubo un error") || res.message.includes("Error interno al crear")), res.message);
                    // TEST 4
                    testTitle("createSeller - Falla BD/Transacción con Compensación (Rollback) Exitosa");
                    resetMocks();
                    global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
                    return [4 /*yield*/, createSeller({ name: 'Nuevo', email: 'nuevo@test.com' })];
                case 5:
                    res = _a.sent();
                    logAssert(res.success === false && res.message.includes("cuenta de auth revertida exitosamente"), res.message);
                    // TEST 5
                    testTitle("createSeller - Falla BD/Transacción con Compensación Fallida (Posible Inconsistencia)");
                    resetMocks();
                    global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
                    global.SIMULATE_AUTH_DELETE_ERROR = true;
                    return [4 /*yield*/, createSeller({ name: 'Nuevo', email: 'nuevo@test.com' })];
                case 6:
                    res = _a.sent();
                    logAssert(res.success === false && res.message.includes("Posible inconsistencia"), res.message);
                    // TEST 6
                    testTitle("updateSeller - Falla Auth por Excepción al inicio (Abortado sin tocar Prisma)");
                    resetMocks();
                    global.SIMULATE_AUTH_UPDATE_ERROR = true;
                    return [4 /*yield*/, updateSeller('seller-exist', { name: 'New Name', email: 'new@test.com', status: 'suspended' })];
                case 7:
                    res = _a.sent();
                    logAssert(res.success === false && res.message.includes("Excepción de Auth, actualización cancelada"), res.message);
                    // TEST 7
                    testTitle("updateSeller - Falla BD/Transacción con Compensación (Rollback) Exitosa");
                    resetMocks();
                    global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
                    return [4 /*yield*/, updateSeller('seller-exist', { name: 'New Name', email: 'new@test.com', status: 'suspended' })];
                case 8:
                    res = _a.sent();
                    logAssert(res.success === false && res.message.includes("cambios de Auth revertidos exitosamente"), res.message);
                    // TEST 8
                    testTitle("updateSeller - Falla BD/Transacción con Compensación Fallida (Inconsistencia detectada)");
                    resetMocks();
                    global.mockUpdateCallCount = 0;
                    global.SIMULATE_PRISMA_TRANSACTION_ERROR = true;
                    global.SIMULATE_AUTH_UPDATE_COMPENSATION_ERROR = true;
                    return [4 /*yield*/, updateSeller('seller-exist', { name: 'New Name', email: 'new@test.com', status: 'suspended' })];
                case 9:
                    res = _a.sent();
                    logAssert(res.success === false && res.message.includes("Inconsistencia detectada"), res.message);
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    console.error("Test framework error:", error_1);
                    return [3 /*break*/, 11];
                case 11:
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
                    return [2 /*return*/];
            }
        });
    });
}
runTests();
