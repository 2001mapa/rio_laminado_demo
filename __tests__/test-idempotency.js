"use strict";
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
var module_1 = __importDefault(require("module"));
var client_1 = require("@prisma/client");
var child_process_1 = require("child_process");
var originalRequire = module_1.default.prototype.require;
// Generate unique schema name for isolation
var schemaName = 'test_schema_' + Date.now();
// Original URLs
var baseDbUrl = process.env.DATABASE_URL || "postgresql://postgres.zrthgldcoweydtyxiscj:Or0.Laminado18k.Supabase@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
var baseDirectUrl = process.env.DIRECT_URL || "postgresql://postgres.zrthgldcoweydtyxiscj:Or0.Laminado18k.Supabase@aws-0-us-west-2.pooler.supabase.com:5432/postgres";
var testDbUrl = baseDbUrl.includes('?') ? baseDbUrl + '&schema=' + schemaName : baseDbUrl + '?schema=' + schemaName;
var testDirectUrl = baseDirectUrl.includes('?') ? baseDirectUrl + '&schema=' + schemaName : baseDirectUrl + '?schema=' + schemaName;
console.log("==================================================");
console.log("🚀 PREPARANDO ENTORNO DE INTEGRACIÓN AISLADO");
console.log("Schema:", schemaName);
// 1. Push schema to the isolated namespace
(0, child_process_1.execSync)('npx prisma db push --accept-data-loss', {
    env: __assign(__assign({}, process.env), { DATABASE_URL: testDbUrl, DIRECT_URL: testDirectUrl }),
    stdio: 'inherit'
});
// 2. Instantiate isolated Prisma
var testPrisma = new client_1.PrismaClient({
    datasources: { db: { url: testDbUrl } }
});
// Variables for mock authorization
var mockUserId = 'vendedor-test-auth';
var mockRole = 'vendedor';
var bypassFirstFindUnique = false;
// Proxy findUnique to simulate race conditions
var originalFindUnique = testPrisma.order.findUnique;
testPrisma.order.findUnique = function (args) {
    var arguments_1 = arguments;
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (bypassFirstFindUnique && ((_a = args.where) === null || _a === void 0 ? void 0 : _a.clientRequestId) === 'req-race-777') {
                        bypassFirstFindUnique = false;
                        return [2 /*return*/, null]; // Simulamos que el SELECT inicial no encontró nada (condición de carrera)
                    }
                    return [4 /*yield*/, originalFindUnique.apply(this, arguments_1)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    });
};
// Monkey patch imports to use testPrisma and mock auth
module_1.default.prototype.require = function (path) {
    var _this = this;
    if (path === '@/utils/auth-helpers') {
        return { requireRole: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, ({ user: { id: mockUserId }, role: mockRole })];
            }); }); } };
    }
    if (path === '@/lib/audit') {
        return { getAuditActor: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, ({})];
            }); }); }, logAuditEvent: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); } };
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
var createOrder = require('../src/app/actions/orders').createOrder;
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var hasErrors, logAssert, seller, customer1, customer2, product, res, firstOrderId, prodCheck, res2, res3, res4, racedRequestId, racedOrder, res5, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("==================================================");
                    console.log("🚀 EJECUTANDO TESTS AUTOMATIZADOS DE INTEGRACIÓN");
                    console.log("==================================================");
                    hasErrors = false;
                    logAssert = function (condition, msg) {
                        if (condition)
                            console.log("  ✅ PASSED: " + msg);
                        else {
                            console.error("  ❌ FAILED: " + msg);
                            hasErrors = true;
                        }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 14, , 15]);
                    // A. SETUP SEED DATA in Isolated Schema
                    console.log("\\n[SETUP] Insertando datos base...");
                    return [4 /*yield*/, testPrisma.seller.create({
                            data: { id: 'seller-1', authUserId: 'vendedor-test-auth', name: 'Vendedor Test', email: 'v@test.com', status: 'active' }
                        })];
                case 2:
                    seller = _a.sent();
                    return [4 /*yield*/, testPrisma.customer.create({
                            data: { id: 'cust-1', authUserId: 'cust-1-auth', name: 'Cliente 1', email: 'c1@test.com', status: 'active', showDiscount: false, discount: 0 }
                        })];
                case 3:
                    customer1 = _a.sent();
                    return [4 /*yield*/, testPrisma.customer.create({
                            data: { id: 'cust-2', authUserId: 'cust-2-auth', name: 'Cliente 2', email: 'c2@test.com', status: 'active', showDiscount: false, discount: 0 }
                        })];
                case 4:
                    customer2 = _a.sent();
                    return [4 /*yield*/, testPrisma.product.create({
                            data: { id: 'prod-1', sku: 'P1', name: 'Anillo Test', category: 'Anillos', material: 'Oro 18k', physicalStock: 10, reservedStock: 0, price: 100, isActive: true }
                        })];
                case 5:
                    product = _a.sent();
                    console.log("\\n[TEST] 1. Crear pedido normal con clientRequestId");
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-1',
                            clientRequestId: 'req-abc-123',
                            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
                        })];
                case 6:
                    res = _a.sent();
                    logAssert(res.success === true, "Pedido creado con éxito");
                    firstOrderId = res.order.id;
                    return [4 /*yield*/, testPrisma.product.findUnique({ where: { id: 'prod-1' } })];
                case 7:
                    prodCheck = _a.sent();
                    logAssert(prodCheck.reservedStock === 2, "Stock reservado = 2");
                    console.log("\\n[TEST] 2. Reintento idéntico devuelve el mismo pedido sin duplicar stock");
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-1',
                            clientRequestId: 'req-abc-123',
                            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
                        })];
                case 8:
                    res2 = _a.sent();
                    logAssert(res2.success === true, "Devuelve éxito instantáneamente");
                    logAssert(res2.order.id === firstOrderId, "Es exactamente el mismo ID de pedido");
                    return [4 /*yield*/, testPrisma.product.findUnique({ where: { id: 'prod-1' } })];
                case 9:
                    prodCheck = _a.sent();
                    logAssert(prodCheck.reservedStock === 2, "El stock reservado SIGUE siendo 2, no 4");
                    console.log("\\n[TEST] 3. Intento de reutilizar ID por otro cliente (Colisión Cruzada)");
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-2', // Diferente cliente
                            clientRequestId: 'req-abc-123',
                            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
                        })];
                case 10:
                    res3 = _a.sent();
                    logAssert(res3.success === false, "Falló como se esperaba");
                    logAssert(res3.error.includes("colisión"), "El error de colisión evita fuga de datos cruzada: " + res3.error);
                    console.log("\\n[TEST] 4. Intento de reutilizar ID con contenido distinto");
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-1',
                            clientRequestId: 'req-abc-123',
                            items: [{ productId: 'prod-1', quantity: 5, sizeDetails: [{ size: '7', quantity: 5 }] }] // Distinta cantidad
                        })];
                case 11:
                    res4 = _a.sent();
                    logAssert(res4.success === false, "Falló por contenido distinto");
                    logAssert(res4.error.includes("distinto contenido"), "Error detectó discrepancia: " + res4.error);
                    console.log("\\n[TEST] 5. Carrera concurrente de clientRequestId (P2002 Race Condition)");
                    racedRequestId = 'req-race-777';
                    return [4 /*yield*/, testPrisma.order.create({
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
                        })];
                case 12:
                    racedOrder = _a.sent();
                    // Simulamos que nuestro proceso no vió el pedido en el check INICIAL
                    bypassFirstFindUnique = true;
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-1',
                            clientRequestId: racedRequestId,
                            items: [{ productId: 'prod-1', quantity: 1, sizeDetails: [{ size: '7', quantity: 1 }] }]
                        })];
                case 13:
                    res5 = _a.sent();
                    logAssert(res5.success === true, "Recuperación de P2002 exitosa");
                    if (res5.success) {
                        logAssert(res5.order.id === racedOrder.id, "Devolvió el pedido ganador de la carrera");
                    }
                    return [3 /*break*/, 15];
                case 14:
                    error_1 = _a.sent();
                    console.error("Test framework error:", error_1);
                    hasErrors = true;
                    return [3 /*break*/, 15];
                case 15:
                    // Cleanup
                    console.log("\\n🧹 Limpiando esquema de pruebas...");
                    return [4 /*yield*/, testPrisma.$executeRawUnsafe("DROP SCHEMA IF EXISTS \"${schemaName}\" CASCADE;`);\n  await testPrisma.$disconnect();\n\n  console.log(\"\\n==================================================\");\n  if (hasErrors) {\n    console.error(\"\u274C ALGUNAS PRUEBAS FALLARON\");\n    process.exit(1);\n  } else {\n    console.log(\"\u2705 TODAS LAS PRUEBAS PASARON\");\n    process.exit(0);\n  }\n}\n\nrunTests();\n")];
                case 16:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
