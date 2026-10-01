"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditActor = getAuditActor;
exports.sanitizeChanges = sanitizeChanges;
exports.logAuditEvent = logAuditEvent;
const prisma_1 = require("./prisma");
const auth_helpers_1 = require("../utils/auth-helpers");
async function getAuditActor() {
    var _a;
    const { user, role } = await (0, auth_helpers_1.requireRole)(['admin', 'vendedor', 'cliente']);
    let name = user.email || user.id;
    if (role === 'admin') {
        name = ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) || user.email || 'Admin';
    }
    else if (role === 'vendedor') {
        const p = await prisma_1.prisma.seller.findUnique({ where: { authUserId: user.id } });
        if (p)
            name = p.name;
    }
    else if (role === 'cliente') {
        const p = await prisma_1.prisma.customer.findUnique({ where: { authUserId: user.id } });
        if (p)
            name = p.name;
    }
    return { id: user.id, name, role };
}
// Remove sensitive data
function sanitizeChanges(changes) {
    if (!changes)
        return null;
    const sanitized = JSON.parse(JSON.stringify(changes));
    const sensitiveKeys = ['password', 'token', 'cookie', 'secret', 'key'];
    const sanitizeObj = (obj) => {
        if (typeof obj !== 'object' || obj === null)
            return;
        for (const key in obj) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                obj[key] = '[REDACTED]';
            }
            else if (typeof obj[key] === 'object') {
                sanitizeObj(obj[key]);
            }
        }
    };
    sanitizeObj(sanitized);
    return sanitized;
}
async function logAuditEvent(actor, payload, tx) {
    const db = tx || prisma_1.prisma;
    return await db.auditEvent.create({
        data: {
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            action: payload.action,
            entityType: payload.entityType,
            entityId: payload.entityId,
            sku: payload.sku,
            orderNumber: payload.orderNumber,
            origin: payload.origin || 'manual',
            result: payload.result || 'success',
            batchId: payload.batchId,
            changes: sanitizeChanges(payload.changes)
        }
    });
}
