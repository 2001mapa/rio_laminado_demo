import 'server-only';

import { prisma } from '@/lib/prisma';

const maintenanceEvent = {
  action: 'CLIENT_MAINTENANCE_SET',
  entityType: 'SYSTEM',
  entityId: 'client-site',
} as const;

export async function isClientMaintenanceActive(): Promise<boolean> {
  const latest = await prisma.auditEvent.findFirst({
    where: maintenanceEvent,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { changes: true },
  });
  const changes = latest?.changes;
  return !!changes && typeof changes === 'object' && !Array.isArray(changes)
    && 'active' in changes && changes.active === true;
}

export { maintenanceEvent };
