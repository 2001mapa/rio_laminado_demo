'use server';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSeller = createSeller;
exports.updateSeller = updateSeller;
var audit_1 = require("@/lib/audit");
var crypto_1 = __importDefault(require("crypto"));
var prisma_1 = require("@/lib/prisma");
var auth_helpers_1 = require("@/utils/auth-helpers");
var supabase_js_1 = require("@supabase/supabase-js");
var supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
function getAdminClient() {
    return (0, supabase_js_1.createClient)(supabaseAdminUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
function isValidEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
function createSeller(data) {
    return __awaiter(this, void 0, void 0, function () {
        var trimmedName, normalizedEmail, existing, adminAuthClient, tempPassword, authUser_1, newlyCreated, _a, createdUser, createError, actor_1, seller, dbError_1, deleteError, compensationEx_1, error_1;
        var _this = this;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, auth_helpers_1.requireRole)(['admin'])];
                case 1:
                    _d.sent();
                    trimmedName = (_b = data.name) === null || _b === void 0 ? void 0 : _b.trim();
                    normalizedEmail = (_c = data.email) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
                    if (!trimmedName)
                        return [2 /*return*/, { success: false, message: 'El nombre es obligatorio.' }];
                    if (!normalizedEmail || !isValidEmail(normalizedEmail))
                        return [2 /*return*/, { success: false, message: 'Correo electrónico inválido.' }];
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 14, , 15]);
                    return [4 /*yield*/, prisma_1.prisma.seller.findUnique({
                            where: { email: normalizedEmail }
                        })];
                case 3:
                    existing = _d.sent();
                    if (existing) {
                        return [2 /*return*/, { success: false, message: 'Ya existe un perfil de vendedor con este correo electrónico.' }];
                    }
                    adminAuthClient = getAdminClient();
                    tempPassword = 'V-' + crypto_1.default.randomBytes(6).toString('hex').toUpperCase() + '*Ab1';
                    authUser_1 = null;
                    newlyCreated = false;
                    return [4 /*yield*/, adminAuthClient.auth.admin.createUser({
                            email: normalizedEmail,
                            password: tempPassword,
                            email_confirm: true,
                            user_metadata: { name: trimmedName, role: 'vendedor' },
                            app_metadata: { role: 'vendedor' }
                        })];
                case 4:
                    _a = _d.sent(), createdUser = _a.data, createError = _a.error;
                    if (createError) {
                        return [2 /*return*/, { success: false, message: "La cuenta ya existe en autenticaci\u00F3n o hubo un error: ".concat(createError.message) }];
                    }
                    authUser_1 = createdUser.user;
                    newlyCreated = true;
                    _d.label = 5;
                case 5:
                    _d.trys.push([5, 8, , 13]);
                    return [4 /*yield*/, (0, audit_1.getAuditActor)()];
                case 6:
                    actor_1 = _d.sent();
                    return [4 /*yield*/, prisma_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var createdSeller;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.seller.create({
                                            data: {
                                                name: trimmedName,
                                                email: normalizedEmail,
                                                authUserId: authUser_1.id,
                                                status: 'active'
                                            }
                                        })];
                                    case 1:
                                        createdSeller = _a.sent();
                                        return [4 /*yield*/, (0, audit_1.logAuditEvent)(actor_1, { action: 'CREATE_SELLER', entityType: 'SELLER', entityId: createdSeller.id, changes: { email: createdSeller.email } }, tx)];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, createdSeller];
                                }
                            });
                        }); })];
                case 7:
                    seller = _d.sent();
                    return [2 /*return*/, {
                            success: true,
                            seller: seller,
                            tempPassword: tempPassword
                        }];
                case 8:
                    dbError_1 = _d.sent();
                    if (!(newlyCreated && authUser_1)) return [3 /*break*/, 12];
                    _d.label = 9;
                case 9:
                    _d.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, adminAuthClient.auth.admin.deleteUser(authUser_1.id)];
                case 10:
                    deleteError = (_d.sent()).error;
                    if (deleteError) {
                        return [2 /*return*/, { success: false, message: "ATENCI\u00D3N: Error en BD (".concat(dbError_1.message, "). Eliminar cuenta Auth devolvi\u00F3 error (").concat(deleteError.message, "). Posible inconsistencia.") }];
                    }
                    return [3 /*break*/, 12];
                case 11:
                    compensationEx_1 = _d.sent();
                    return [2 /*return*/, { success: false, message: "ATENCI\u00D3N: Error en BD (".concat(dbError_1.message, "). Excepci\u00F3n al intentar eliminar cuenta Auth (").concat(compensationEx_1.message, "). Posible inconsistencia.") }];
                case 12: return [2 /*return*/, { success: false, message: "Error en base de datos al guardar perfil, cuenta de auth revertida exitosamente: ".concat(dbError_1.message) }];
                case 13: return [3 /*break*/, 15];
                case 14:
                    error_1 = _d.sent();
                    console.error('Error creating seller:', error_1);
                    return [2 /*return*/, { success: false, message: "Error interno al crear el vendedor: ".concat(error_1.message) }];
                case 15: return [2 /*return*/];
            }
        });
    });
}
function updateSeller(id, data) {
    return __awaiter(this, void 0, void 0, function () {
        var trimmedName, normalizedEmail, validStatuses, existing, existingSeller_1, adminAuthClient, authUpdated, authError, authEx_1, actor_2, seller, dbError_2, compensationError, compensationEx_2, error_2;
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, auth_helpers_1.requireRole)(['admin'])];
                case 1:
                    _c.sent();
                    trimmedName = (_a = data.name) === null || _a === void 0 ? void 0 : _a.trim();
                    normalizedEmail = (_b = data.email) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
                    validStatuses = ['active', 'suspended'];
                    if (!trimmedName)
                        return [2 /*return*/, { success: false, message: 'El nombre es obligatorio.' }];
                    if (!normalizedEmail || !isValidEmail(normalizedEmail))
                        return [2 /*return*/, { success: false, message: 'Correo electrónico inválido.' }];
                    if (!validStatuses.includes(data.status))
                        return [2 /*return*/, { success: false, message: 'Estado inválido.' }];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 17, , 18]);
                    return [4 /*yield*/, prisma_1.prisma.seller.findUnique({
                            where: { email: normalizedEmail }
                        })];
                case 3:
                    existing = _c.sent();
                    if (existing && existing.id !== id) {
                        return [2 /*return*/, { success: false, message: 'El correo electrónico ya está en uso por otro vendedor.' }];
                    }
                    return [4 /*yield*/, prisma_1.prisma.seller.findUnique({ where: { id: id } })];
                case 4:
                    existingSeller_1 = _c.sent();
                    if (!existingSeller_1)
                        return [2 /*return*/, { success: false, message: 'Vendedor no encontrado.' }];
                    if (!existingSeller_1.authUserId) {
                        return [2 /*return*/, { success: false, message: 'El vendedor no tiene un usuario de autenticación vinculado (authUserId).' }];
                    }
                    adminAuthClient = getAdminClient();
                    authUpdated = false;
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, adminAuthClient.auth.admin.updateUserById(existingSeller_1.authUserId, {
                            email: normalizedEmail,
                            user_metadata: { name: trimmedName }
                        })];
                case 6:
                    authError = (_c.sent()).error;
                    if (authError) {
                        return [2 /*return*/, { success: false, message: "Error de Auth, actualizaci\u00F3n cancelada: ".concat(authError.message) }];
                    }
                    authUpdated = true;
                    return [3 /*break*/, 8];
                case 7:
                    authEx_1 = _c.sent();
                    return [2 /*return*/, { success: false, message: "Excepci\u00F3n de Auth, actualizaci\u00F3n cancelada: ".concat(authEx_1.message) }];
                case 8:
                    _c.trys.push([8, 11, , 16]);
                    return [4 /*yield*/, (0, audit_1.getAuditActor)()];
                case 9:
                    actor_2 = _c.sent();
                    return [4 /*yield*/, prisma_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var updated;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.seller.update({
                                            where: { id: id },
                                            data: {
                                                name: trimmedName,
                                                email: normalizedEmail,
                                                status: data.status
                                            }
                                        })];
                                    case 1:
                                        updated = _a.sent();
                                        return [4 /*yield*/, (0, audit_1.logAuditEvent)(actor_2, {
                                                action: 'UPDATE_SELLER',
                                                entityType: 'SELLER',
                                                entityId: id,
                                                changes: {
                                                    before: { name: existingSeller_1.name, email: existingSeller_1.email, status: existingSeller_1.status },
                                                    after: { name: updated.name, email: updated.email, status: updated.status }
                                                }
                                            }, tx)];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, updated];
                                }
                            });
                        }); })];
                case 10:
                    seller = _c.sent();
                    return [2 /*return*/, {
                            success: true,
                            message: 'Vendedor actualizado exitosamente.',
                            seller: seller
                        }];
                case 11:
                    dbError_2 = _c.sent();
                    if (!(authUpdated && existingSeller_1.authUserId)) return [3 /*break*/, 15];
                    _c.label = 12;
                case 12:
                    _c.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, adminAuthClient.auth.admin.updateUserById(existingSeller_1.authUserId, {
                            email: existingSeller_1.email, // rollback email
                            user_metadata: { name: existingSeller_1.name } // rollback name
                        })];
                case 13:
                    compensationError = (_c.sent()).error;
                    if (compensationError) {
                        return [2 /*return*/, { success: false, message: "ATENCI\u00D3N: Fall\u00F3 actualizaci\u00F3n local (".concat(dbError_2.message, "). Reversi\u00F3n de Auth devolvi\u00F3 error (").concat(compensationError.message, "). Inconsistencia detectada.") }];
                    }
                    return [3 /*break*/, 15];
                case 14:
                    compensationEx_2 = _c.sent();
                    return [2 /*return*/, { success: false, message: "ATENCI\u00D3N: Fall\u00F3 actualizaci\u00F3n local (".concat(dbError_2.message, "). Excepci\u00F3n al intentar reversi\u00F3n de Auth (").concat(compensationEx_2.message, "). Inconsistencia detectada.") }];
                case 15: return [2 /*return*/, { success: false, message: "Error interno al actualizar base de datos, cambios de Auth revertidos exitosamente: ".concat(dbError_2.message) }];
                case 16: return [3 /*break*/, 18];
                case 17:
                    error_2 = _c.sent();
                    console.error('Error updating seller:', error_2);
                    return [2 /*return*/, { success: false, message: "Error general: ".concat(error_2.message) }];
                case 18: return [2 /*return*/];
            }
        });
    });
}
