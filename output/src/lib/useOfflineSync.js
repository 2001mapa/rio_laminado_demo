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
exports.BASE_DELAY_MS = exports.MAX_RETRIES = exports.activeSyncs = void 0;
exports.executeSync = executeSync;
exports.useOfflineSync = useOfflineSync;
var react_1 = require("react");
var offlineQueue_1 = require("./offlineQueue");
var client_1 = require("@/utils/supabase/client");
var orders_1 = require("@/app/actions/orders");
exports.activeSyncs = new Set();
exports.MAX_RETRIES = 5;
exports.BASE_DELAY_MS = 2000;
// Lógica pura y testeable con Inyección de Dependencias
function executeSync(sellerId_1, refreshData_1, bypassUUID_1) {
    return __awaiter(this, arguments, void 0, function (sellerId, refreshData, bypassUUID, deps) {
        var pendingOrders, now, closestNextRetry, _i, pendingOrders_1, order, isOnline, isBypass, nextRetryAt, res, nextRetry, error_1, nextRetry;
        if (deps === void 0) { deps = {
            getPendingOrders: offlineQueue_1.getPendingOrders,
            updatePendingOrderStatus: offlineQueue_1.updatePendingOrderStatus,
            removePendingOrder: offlineQueue_1.removePendingOrder,
            createOrderAction: orders_1.createOrder
        }; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, deps.getPendingOrders(sellerId)];
                case 1:
                    pendingOrders = _a.sent();
                    now = Date.now();
                    closestNextRetry = null;
                    _i = 0, pendingOrders_1 = pendingOrders;
                    _a.label = 2;
                case 2:
                    if (!(_i < pendingOrders_1.length)) return [3 /*break*/, 21];
                    order = pendingOrders_1[_i];
                    if (exports.activeSyncs.has(order.clientRequestId))
                        return [3 /*break*/, 20];
                    if (!(order.status === 'syncing' && typeof navigator !== 'undefined' && navigator.onLine)) return [3 /*break*/, 4];
                    return [4 /*yield*/, deps.updatePendingOrderStatus(order.clientRequestId, { status: 'failed_recoverable' })];
                case 3:
                    _a.sent();
                    order.status = 'failed_recoverable';
                    _a.label = 4;
                case 4:
                    isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
                    if (!((order.status === 'pending' || order.status === 'failed_recoverable') && isOnline)) return [3 /*break*/, 20];
                    isBypass = bypassUUID === order.clientRequestId;
                    if (!(order.status === 'failed_recoverable' && !isBypass)) return [3 /*break*/, 7];
                    if (!(order.retryCount >= exports.MAX_RETRIES)) return [3 /*break*/, 6];
                    return [4 /*yield*/, deps.updatePendingOrderStatus(order.clientRequestId, { status: 'failed_intervention', lastError: 'Requiere intervención/Verificar con servidor. La respuesta pudo haberse perdido. No descartar, verifique con administración.' })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 20];
                case 6:
                    nextRetryAt = order.nextRetryAt || (order.createdAt + (Math.pow(2, order.retryCount) * exports.BASE_DELAY_MS));
                    if (now < nextRetryAt) {
                        if (!closestNextRetry || nextRetryAt < closestNextRetry) {
                            closestNextRetry = nextRetryAt;
                        }
                        return [3 /*break*/, 20];
                    }
                    _a.label = 7;
                case 7:
                    exports.activeSyncs.add(order.clientRequestId);
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 17, 19, 20]);
                    return [4 /*yield*/, deps.updatePendingOrderStatus(order.clientRequestId, {
                            status: 'syncing',
                            lastAttemptAt: now
                        })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, deps.createOrderAction({
                            customerId: order.customerId,
                            items: order.items,
                            clientRequestId: order.clientRequestId
                        })];
                case 10:
                    res = _a.sent();
                    if (!(res.success && res.order && res.order.orderNumber)) return [3 /*break*/, 12];
                    return [4 /*yield*/, deps.removePendingOrder(order.clientRequestId)];
                case 11:
                    _a.sent();
                    refreshData();
                    return [3 /*break*/, 16];
                case 12:
                    if (!(res.code === 'NETWORK_OR_DB_ERROR' || !res.code)) return [3 /*break*/, 14];
                    nextRetry = now + (Math.pow(2, order.retryCount + 1) * exports.BASE_DELAY_MS);
                    return [4 /*yield*/, deps.updatePendingOrderStatus(order.clientRequestId, {
                            status: 'failed_recoverable',
                            lastError: res.error || 'Error temporal del servidor',
                            retryCount: order.retryCount + 1,
                            lastAttemptAt: now,
                            nextRetryAt: nextRetry
                        })];
                case 13:
                    _a.sent();
                    if (!closestNextRetry || nextRetry < closestNextRetry)
                        closestNextRetry = nextRetry;
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, deps.updatePendingOrderStatus(order.clientRequestId, {
                        status: 'failed_fatal',
                        lastError: res.error || 'Rechazo del servidor'
                    })];
                case 15:
                    _a.sent();
                    _a.label = 16;
                case 16: return [3 /*break*/, 20];
                case 17:
                    error_1 = _a.sent();
                    nextRetry = now + (Math.pow(2, order.retryCount + 1) * exports.BASE_DELAY_MS);
                    return [4 /*yield*/, deps.updatePendingOrderStatus(order.clientRequestId, {
                            status: 'failed_recoverable',
                            lastError: error_1.message,
                            retryCount: order.retryCount + 1,
                            lastAttemptAt: now,
                            nextRetryAt: nextRetry
                        })];
                case 18:
                    _a.sent();
                    if (!closestNextRetry || nextRetry < closestNextRetry)
                        closestNextRetry = nextRetry;
                    return [3 /*break*/, 20];
                case 19:
                    exports.activeSyncs.delete(order.clientRequestId);
                    return [7 /*endfinally*/];
                case 20:
                    _i++;
                    return [3 /*break*/, 2];
                case 21: return [2 /*return*/, closestNextRetry];
            }
        });
    });
}
function useOfflineSync(refreshData) {
    var _this = this;
    var timerRef = (0, react_1.useRef)(null);
    var syncPendingOrders = (0, react_1.useCallback)(function (bypassUUID) { return __awaiter(_this, void 0, void 0, function () {
        var supabase, authData, closestNextRetry, delay;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeof window === 'undefined')
                        return [2 /*return*/];
                    if (timerRef.current) {
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                    }
                    supabase = (0, client_1.createClient)();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 1:
                    authData = (_a.sent()).data;
                    if (!authData.user)
                        return [2 /*return*/];
                    return [4 /*yield*/, executeSync(authData.user.id, refreshData, bypassUUID)];
                case 2:
                    closestNextRetry = _a.sent();
                    if (closestNextRetry && closestNextRetry > Date.now()) {
                        delay = closestNextRetry - Date.now();
                        timerRef.current = setTimeout(function () { return syncPendingOrders(); }, delay);
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [refreshData]);
    (0, react_1.useEffect)(function () {
        var handleOnline = function () { return syncPendingOrders(); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('focus', handleOnline);
        syncPendingOrders();
        return function () {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('focus', handleOnline);
            if (timerRef.current)
                clearTimeout(timerRef.current);
        };
    }, [syncPendingOrders]);
    return { syncPendingOrders: syncPendingOrders };
}
