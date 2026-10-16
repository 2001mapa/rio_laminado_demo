'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isClientMaintenanceActive, maintenanceEvent } from '@/lib/client-maintenance';
import { requireRole } from '@/utils/auth-helpers';

export async function setClientMaintenanceActive(active: boolean) {
  const { user } = await requireRole(['admin']);
  if (typeof active !== 'boolean') throw new Error('Estado de mantenimiento inválido');

  await prisma.auditEvent.create({
    data: {
      ...maintenanceEvent,
      actorId: user.id,
      actorName: user.email || 'Administrador',
      actorRole: 'admin',
      origin: 'admin_dashboard',
      result: 'success',
      changes: { active },
    },
  });
  revalidatePath('/cliente', 'layout');
  return { active };
}

export async function checkClientMaintenanceActive() {
  await requireRole(['cliente']);
  return isClientMaintenanceActive();
}
