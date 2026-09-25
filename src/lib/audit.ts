import { prisma } from './prisma';
import { requireRole } from '../utils/auth-helpers';

export type AuditActor = {
  id: string;
  name: string;
  role: string;
};

export type AuditEventPayload = {
  action: string;
  entityType: string;
  entityId: string;
  sku?: string;
  orderNumber?: string;
  origin?: string;
  result?: string;
  batchId?: string;
  changes?: Record<string, any>;
};

export async function getAuditActor(): Promise<AuditActor> {
  const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
  let name = user.email || user.id;
  if (role === 'admin') {
     name = user.user_metadata?.full_name || user.email || 'Admin';
  } else if (role === 'vendedor') {
     const p = await prisma.seller.findUnique({ where: { authUserId: user.id } });
     if (p) name = p.name;
  } else if (role === 'cliente') {
     const p = await prisma.customer.findUnique({ where: { authUserId: user.id } });
     if (p) name = p.name;
  }
  return { id: user.id, name, role };
}

// Remove sensitive data
export function sanitizeChanges(changes: any) {
  if (!changes) return null;
  const sanitized = JSON.parse(JSON.stringify(changes));
  const sensitiveKeys = ['password', 'token', 'cookie', 'secret', 'key'];
  
  const sanitizeObj = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key in obj) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitizeObj(obj[key]);
      }
    }
  };
  
  sanitizeObj(sanitized);
  return sanitized;
}

export async function logAuditEvent(actor: AuditActor, payload: AuditEventPayload, tx?: any) {
  const db = tx || prisma;
  
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
