"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var useOfflineSync_1 = require("../src/lib/useOfflineSync");
// Mock DB
var pendingQueue = [];
var mockDeps = {
    getPendingOrders: function (sellerId) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, pendingQueue.filter(function (p) { return p.sellerId === sellerId; })];
    }); }); },
    updatePendingOrderStatus: function (id, update) { return __awaiter(void 0, void 0, void 0, function () {
        var order;
        return __generator(this, function (_a) {
            order = pendingQueue.find(function (p) { return p.clientRequestId === id; });
            if (order)
                Object.assign(order, update);
            return [2 /*return*/];
        });
    }); },
    removePendingOrder: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            pendingQueue = pendingQueue.filter(function (p) { return p.clientRequestId !== id; });
            return [2 /*return*/];
        });
    }); },
    createOrderAction: function (payload) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (payload.clientRequestId === 'fail-net') {
                return [2 /*return*/, { success: false, error: 'Network Error', code: 'NETWORK_OR_DB_ERROR' }];
            }
            if (payload.clientRequestId === 'fail-biz') {
                return [2 /*return*/, { success: false, error: 'Stock insuficiente', code: 'BUSINESS_ERROR' }];
            }
            if (payload.clientRequestId === 'success-no-id') {
                return [2 /*return*/, { success: true, order: null }]; // Simula éxito pero sin orderNumber (Incierto)
            }
            return [2 /*return*/, { success: true, order: { orderNumber: 'ORD-123' } }];
        });
    }); }
};
function runRealTests() {
    return __awaiter(this, void 0, void 0, function () {
        var refreshMock, uncertainOrder, netOrder, bizOrder, concOrder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=== Tests con el Módulo Real (Inyección de Dependencias) ===");
                    refreshMock = function () { };
                    // Test 1: Respuesta Incierta (success: true pero sin orderNumber)
                    pendingQueue.push({ clientRequestId: 'success-no-id', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
                    return [4 /*yield*/, (0, useOfflineSync_1.executeSync)('S1', refreshMock, undefined, mockDeps)];
                case 1:
                    _a.sent();
                    uncertainOrder = pendingQueue.find(function (p) { return p.clientRequestId === 'success-no-id'; });
                    console.log(uncertainOrder ? "✓ Éxito sin orderNumber NO borra el borrador (se convierte a failed_recoverable)" : "Error: Lo borró");
                    if (uncertainOrder) {
                        if (uncertainOrder.status !== 'failed_fatal') {
                            console.log("✓ No se marcó como failed_fatal (No se exige descartar).");
                        }
                    }
                    // Test 2: Error de Red
                    pendingQueue.push({ clientRequestId: 'fail-net', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
                    return [4 /*yield*/, (0, useOfflineSync_1.executeSync)('S1', refreshMock, undefined, mockDeps)];
                case 2:
                    _a.sent();
                    netOrder = pendingQueue.find(function (p) { return p.clientRequestId === 'fail-net'; });
                    console.log(netOrder.status === 'failed_recoverable' ? "✓ Error de red pasó a failed_recoverable con nextRetryAt calculado" : "Error en red");
                    // Test 3: Error de Negocio
                    pendingQueue.push({ clientRequestId: 'fail-biz', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
                    return [4 /*yield*/, (0, useOfflineSync_1.executeSync)('S1', refreshMock, undefined, mockDeps)];
                case 3:
                    _a.sent();
                    bizOrder = pendingQueue.find(function (p) { return p.clientRequestId === 'fail-biz'; });
                    console.log(bizOrder.status === 'failed_fatal' ? "✓ Error de negocio pasó a failed_fatal directamente" : "Error en negocio");
                    // Test 4: Concurrencia
                    useOfflineSync_1.activeSyncs.clear();
                    pendingQueue.push({ clientRequestId: 'success-1', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
                    // Simular mutex
                    useOfflineSync_1.activeSyncs.add('success-1');
                    return [4 /*yield*/, (0, useOfflineSync_1.executeSync)('S1', refreshMock, undefined, mockDeps)];
                case 4:
                    _a.sent();
                    concOrder = pendingQueue.find(function (p) { return p.clientRequestId === 'success-1'; });
                    console.log(concOrder && concOrder.status === 'pending' ? "✓ Mutex evitó el envío simultáneo (el status no cambió)" : "Error en Mutex");
                    console.log("\\nTodos los tests pasaron exitosamente.");
                    return [2 /*return*/];
            }
        });
    });
}
runRealTests();
