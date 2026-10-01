"use strict";
'use server';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSeller = createSeller;
exports.updateSeller = updateSeller;
const audit_1 = require("@/lib/audit");
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("@/lib/prisma");
const auth_helpers_1 = require("@/utils/auth-helpers");
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
function getAdminClient() {
    return (0, supabase_js_1.createClient)(supabaseAdminUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
async function createSeller(data) {
    var _a, _b;
    await (0, auth_helpers_1.requireRole)(['admin']);
    const trimmedName = (_a = data.name) === null || _a === void 0 ? void 0 : _a.trim();
    const normalizedEmail = (_b = data.email) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
    if (!trimmedName)
        return { success: false, message: 'El nombre es obligatorio.' };
    if (!normalizedEmail || !isValidEmail(normalizedEmail))
        return { success: false, message: 'Correo electrónico inválido.' };
    try {
        const existing = await prisma_1.prisma.seller.findUnique({
            where: { email: normalizedEmail }
        });
        if (existing) {
            return { success: false, message: 'Ya existe un perfil de vendedor con este correo electrónico.' };
        }
        const adminAuthClient = getAdminClient();
        const tempPassword = 'V-' + crypto_1.default.randomBytes(6).toString('hex').toUpperCase() + '*Ab1';
        let authUser = null;
        let newlyCreated = false;
        const { data: createdUser, error: createError } = await adminAuthClient.auth.admin.createUser({
            email: normalizedEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { name: trimmedName, role: 'vendedor' },
            app_metadata: { role: 'vendedor' }
        });
        if (createError) {
            return { success: false, message: `La cuenta ya existe en autenticación o hubo un error: ${createError.message}` };
        }
        authUser = createdUser.user;
        newlyCreated = true;
        // Now create in Prisma
        try {
            const actor = await (0, audit_1.getAuditActor)();
            const seller = await prisma_1.prisma.$transaction(async (tx) => {
                const createdSeller = await tx.seller.create({
                    data: {
                        name: trimmedName,
                        email: normalizedEmail,
                        authUserId: authUser.id,
                        status: 'active'
                    }
                });
                await (0, audit_1.logAuditEvent)(actor, { action: 'CREATE_SELLER', entityType: 'SELLER', entityId: createdSeller.id, changes: { email: createdSeller.email } }, tx);
                return createdSeller;
            });
            return {
                success: true,
                seller,
                tempPassword
            };
        }
        catch (dbError) {
            // Compensación manual si falla la base de datos
            if (newlyCreated && authUser) {
                try {
                    const { error: deleteError } = await adminAuthClient.auth.admin.deleteUser(authUser.id);
                    if (deleteError) {
                        return { success: false, message: `ATENCIÓN: Error en BD (${dbError.message}). Eliminar cuenta Auth devolvió error (${deleteError.message}). Posible inconsistencia.` };
                    }
                }
                catch (compensationEx) {
                    return { success: false, message: `ATENCIÓN: Error en BD (${dbError.message}). Excepción al intentar eliminar cuenta Auth (${compensationEx.message}). Posible inconsistencia.` };
                }
            }
            return { success: false, message: `Error en base de datos al guardar perfil, cuenta de auth revertida exitosamente: ${dbError.message}` };
        }
    }
    catch (error) {
        console.error('Error creating seller:', error);
        return { success: false, message: `Error interno al crear el vendedor: ${error.message}` };
    }
}
async function updateSeller(id, data) {
    var _a, _b;
    await (0, auth_helpers_1.requireRole)(['admin']);
    const trimmedName = (_a = data.name) === null || _a === void 0 ? void 0 : _a.trim();
    const normalizedEmail = (_b = data.email) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
    const validStatuses = ['active', 'suspended'];
    if (!trimmedName)
        return { success: false, message: 'El nombre es obligatorio.' };
    if (!normalizedEmail || !isValidEmail(normalizedEmail))
        return { success: false, message: 'Correo electrónico inválido.' };
    if (!validStatuses.includes(data.status))
        return { success: false, message: 'Estado inválido.' };
    try {
        const existing = await prisma_1.prisma.seller.findUnique({
            where: { email: normalizedEmail }
        });
        if (existing && existing.id !== id) {
            return { success: false, message: 'El correo electrónico ya está en uso por otro vendedor.' };
        }
        const existingSeller = await prisma_1.prisma.seller.findUnique({ where: { id } });
        if (!existingSeller)
            return { success: false, message: 'Vendedor no encontrado.' };
        if (!existingSeller.authUserId) {
            return { success: false, message: 'El vendedor no tiene un usuario de autenticación vinculado (authUserId).' };
        }
        const adminAuthClient = getAdminClient();
        let authUpdated = false;
        // 1. UPDATE AUTH FIRST
        try {
            const { error: authError } = await adminAuthClient.auth.admin.updateUserById(existingSeller.authUserId, {
                email: normalizedEmail,
                user_metadata: { name: trimmedName }
            });
            if (authError) {
                return { success: false, message: `Error de Auth, actualización cancelada: ${authError.message}` };
            }
            authUpdated = true;
        }
        catch (authEx) {
            return { success: false, message: `Excepción de Auth, actualización cancelada: ${authEx.message}` };
        }
        // 2. UPDATE PRISMA + AUDIT EVENT IN TRANSACTION
        try {
            const actor = await (0, audit_1.getAuditActor)();
            const seller = await prisma_1.prisma.$transaction(async (tx) => {
                const updated = await tx.seller.update({
                    where: { id },
                    data: {
                        name: trimmedName,
                        email: normalizedEmail,
                        status: data.status
                    }
                });
                await (0, audit_1.logAuditEvent)(actor, {
                    action: 'UPDATE_SELLER',
                    entityType: 'SELLER',
                    entityId: id,
                    changes: {
                        before: { name: existingSeller.name, email: existingSeller.email, status: existingSeller.status },
                        after: { name: updated.name, email: updated.email, status: updated.status }
                    }
                }, tx);
                return updated;
            });
            return {
                success: true,
                message: 'Vendedor actualizado exitosamente.',
                seller: seller
            };
        }
        catch (dbError) {
            // 3. COMPENSATION IF DB/AUDIT FAILS
            if (authUpdated && existingSeller.authUserId) {
                try {
                    const { error: compensationError } = await adminAuthClient.auth.admin.updateUserById(existingSeller.authUserId, {
                        email: existingSeller.email, // rollback email
                        user_metadata: { name: existingSeller.name } // rollback name
                    });
                    if (compensationError) {
                        return { success: false, message: `ATENCIÓN: Falló actualización local (${dbError.message}). Reversión de Auth devolvió error (${compensationError.message}). Inconsistencia detectada.` };
                    }
                }
                catch (compensationEx) {
                    return { success: false, message: `ATENCIÓN: Falló actualización local (${dbError.message}). Excepción al intentar reversión de Auth (${compensationEx.message}). Inconsistencia detectada.` };
                }
            }
            return { success: false, message: `Error interno al actualizar base de datos, cambios de Auth revertidos exitosamente: ${dbError.message}` };
        }
    }
    catch (error) {
        console.error('Error updating seller:', error);
        return { success: false, message: `Error general: ${error.message}` };
    }
}
