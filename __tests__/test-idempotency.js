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
var module_1 = __importDefault(require("module"));
var client_1 = require("@prisma/client");
var child_process_1 = require("child_process");
var originalRequire = module_1.default.prototype.require;
if (!process.env.TEST_DATABASE_URL) {
    console.error("❌ ERROR: La prueba de integración requiere TEST_DATABASE_URL explícita.");
    console.error("Ejemplo: TEST_DATABASE_URL='postgresql://...&schema=test_schema' pnpm test");
    process.exit(0); // Exit 0 to skip gracefully instead of breaking generic test runner
}
if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
    console.error("❌ ERROR: TEST_DATABASE_URL no puede ser idéntica a DATABASE_URL de producción.");
    process.exit(1);
}
var testDbUrl = process.env.TEST_DATABASE_URL;
var testDirectUrl = process.env.TEST_DIRECT_URL || testDbUrl;
console.log("==================================================");
console.log("🚀 PREPARANDO ENTORNO DE INTEGRACIÓN (TEST_DATABASE_URL)");
// 1. Push schema to the isolated namespace (Do NOT use --accept-data-loss blindly if not needed, but for a dynamic schema we might need it, however we'll just push normally)
try {
    (0, child_process_1.execSync)('pnpm exec prisma db push --skip-generate', {
        env: __assign(__assign({}, process.env), { DATABASE_URL: testDbUrl, DIRECT_URL: testDirectUrl }),
        stdio: 'inherit'
    });
}
catch (e) {
    console.error("Error inicializando esquema de prueba.");
    process.exit(1);
}
// 2. Instantiate isolated Prisma
var testPrisma = new client_1.PrismaClient({
    datasources: { db: { url: testDbUrl } }
});
// Variables for mock authorization
var mockUserId = 'vendedor-test-auth';
var mockRole = 'vendedor';
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
        var hasErrors, logAssert, seller, customer1, product, res, res2, res3, raceId, reqData, results, successes, orderIds, prodCheck, error_1, e_1, schema;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("==================================================");
                    console.log("🚀 EJECUTANDO TESTS DE IDEMPOTENCIA Y CONCURRENCIA");
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
                    _a.trys.push([1, 10, 11, 19]);
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
                    return [4 /*yield*/, testPrisma.product.create({
                            data: { id: 'prod-1', sku: 'P1', name: 'Anillo Test', category: 'Anillos', material: 'Oro 18k', physicalStock: 10, reservedStock: 0, price: 100, isActive: true }
                        })];
                case 4:
                    product = _a.sent();
                    console.log("\\n[TEST] 1. Crear pedido inicial");
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-1',
                            clientRequestId: 'req-abc-123',
                            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '7', quantity: 2 }] }]
                        })];
                case 5:
                    res = _a.sent();
                    logAssert(res.success === true, "Pedido creado con éxito");
                    console.log("\\n[TEST] 2. Intento con distintas cantidades rechaza");
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-1',
                            clientRequestId: 'req-abc-123',
                            items: [{ productId: 'prod-1', quantity: 3, sizeDetails: [{ size: '7', quantity: 3 }] }]
                        })];
                case 6:
                    res2 = _a.sent();
                    logAssert(res2.success === false, "Detectado contenido distinto");
                    console.log("\\n[TEST] 3. Intento con distintas tallas rechaza");
                    return [4 /*yield*/, createOrder({
                            customerId: 'cust-1',
                            clientRequestId: 'req-abc-123',
                            items: [{ productId: 'prod-1', quantity: 2, sizeDetails: [{ size: '8', quantity: 2 }] }]
                        })];
                case 7:
                    res3 = _a.sent();
                    logAssert(res3.success === false, "Detectada talla distinta");
                    console.log("\\n[TEST] 4. Carrera real concurrente (Promise.all)");
                    raceId = 'req-race-888';
                    reqData = {
                        customerId: 'cust-1',
                        clientRequestId: raceId,
                        items: [{ productId: 'prod-1', quantity: 1, sizeDetails: [{ size: '7', quantity: 1 }] }]
                    };
                    return [4 /*yield*/, Promise.all([
                            createOrder(reqData),
                            createOrder(reqData),
                            createOrder(reqData)
                        ])];
                case 8:
                    results = _a.sent();
                    successes = results.filter(function (r) { return r.success; });
                    orderIds = new Set(successes.map(function (r) { return r.order.id; }));
                    logAssert(successes.length === 3, "Las 3 solicitudes retornaron éxito");
                    logAssert(orderIds.size === 1, "Todas devolvieron exactamente el mismo Order ID de base de datos");
                    return [4 /*yield*/, testPrisma.product.findUnique({ where: { id: 'prod-1' } })];
                case 9:
                    prodCheck = _a.sent();
                    logAssert(prodCheck.reservedStock === 3, "El stock total es 3 (2 del primero + 1 de la carrera). No hubo reservas duplicadas.");
                    return [3 /*break*/, 19];
                case 10:
                    error_1 = _a.sent();
                    console.error("Test framework error:", error_1);
                    hasErrors = true;
                    return [3 /*break*/, 19];
                case 11:
                    // Cleanup
                    console.log("\\n🧹 Limpiando esquema de pruebas...");
                    _a.label = 12;
                case 12:
                    _a.trys.push([12, 14, , 17]);
                    // Limpiamos las tablas generadas
                    return [4 /*yield*/, testPrisma.$executeRawUnsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")];
                case 13:
                    // Limpiamos las tablas generadas
                    _a.sent();
                    return [3 /*break*/, 17];
                case 14:
                    e_1 = _a.sent();
                    schema = testDbUrl.split('schema=')[1];
                    if (!schema) return [3 /*break*/, 16];
                    return [4 /*yield*/, testPrisma.$executeRawUnsafe("DROP SCHEMA \"".concat(schema, "\" CASCADE;"))];
                case 15:
                    _a.sent();
                    _a.label = 16;
                case 16: return [3 /*break*/, 17];
                case 17: return [4 /*yield*/, testPrisma.$disconnect()];
                case 18:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 19:
                    console.log("\\n==================================================");
                    if (hasErrors) {
                        console.error("❌ ALGUNAS PRUEBAS FALLARON");
                        process.exit(1);
                    }
                    else {
                        console.log("✅ TODAS LAS PRUEBAS PASARON");
                        process.exit(0);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
runTests();
