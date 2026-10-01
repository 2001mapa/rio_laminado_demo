"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionUser = getSessionUser;
exports.requireRole = requireRole;
const server_1 = require("@/utils/supabase/server");
const prisma_1 = require("@/lib/prisma"); // Usa el cliente compartido para no agotar conexiones
async function getSessionUser() {
    var _a;
    try {
        const supabase = await (0, server_1.createClient)();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            // Loggear errores de forma silenciosa sin filtrar tokens
            console.error(`[ServerAction] Supabase Auth Error: ${error.name} - ${error.status}`);
            throw new Error(`Supabase Auth Error: ${error.message}`);
        }
        if (!user) {
            return { user: null, role: null };
        }
        // Usamos exclusivamente app_metadata por seguridad
        let role = ((_a = user.app_metadata) === null || _a === void 0 ? void 0 : _a.role) || null;
        if (role === 'admin') {
            return { user, role, status: 'active' };
        }
        let status = 'suspended'; // Default to closed
        try {
            // Centralizar la verificación de estado y resolución
            const seller = await prisma_1.prisma.seller.findUnique({ where: { authUserId: user.id } });
            if (seller) {
                role = 'vendedor';
                status = seller.status;
            }
            else {
                const customer = await prisma_1.prisma.customer.findUnique({ where: { authUserId: user.id } });
                if (customer) {
                    role = 'cliente';
                    status = customer.status;
                }
                else {
                    // Si no está en BD y no es admin en app_metadata, es un usuario huerfano/inválido
                    role = null;
                }
            }
        }
        catch (dbError) {
            console.error('[ServerAction] Database fallback error', dbError);
            role = null;
            status = 'suspended';
        }
        return { user, role, status };
    }
    catch (e) {
        throw new Error('Auth Helper Crash: ' + e.message);
    }
}
async function requireRole(allowedRoles) {
    const { user, role, status } = await getSessionUser();
    if (!user) {
        throw new Error('No autorizado: Sesión de Supabase no encontrada');
    }
    if (!role) {
        throw new Error('No autorizado: Rol o perfil no encontrado');
    }
    if (status !== 'active' && role !== 'admin') {
        throw new Error('No autorizado: Tu cuenta ha sido suspendida.');
    }
    if (!allowedRoles.includes(role)) {
        throw new Error(`No autorizado: Rol "${role}" no permitido`);
    }
    return { user, role };
}
