import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst, create, requireRole, revalidatePath } = vi.hoisted(() => ({
  findFirst: vi.fn(), create: vi.fn(), requireRole: vi.fn(), revalidatePath: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: { auditEvent: { findFirst, create } } }));
vi.mock('@/utils/auth-helpers', () => ({ requireRole }));
vi.mock('next/cache', () => ({ revalidatePath }));

import { isClientMaintenanceActive, maintenanceEvent } from '@/lib/client-maintenance';
import { setClientMaintenanceActive } from '@/app/actions/maintenance';

describe('mantenimiento para clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@example.com' }, role: 'admin' });
    create.mockResolvedValue({ id: 'event-1' });
  });

  it('inicia desactivado y solo se activa con el último evento explícito', async () => {
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ changes: { active: true } });
    expect(await isClientMaintenanceActive()).toBe(false);
    expect(await isClientMaintenanceActive()).toBe(true);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: maintenanceEvent }));
  });

  it('exige rol admin y registra el cambio antes de invalidar el catálogo', async () => {
    expect(await setClientMaintenanceActive(true)).toEqual({ active: true });
    expect(requireRole).toHaveBeenCalledWith(['admin']);
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ ...maintenanceEvent, changes: { active: true } }) });
    expect(revalidatePath).toHaveBeenCalledWith('/cliente', 'layout');
  });

  it('no escribe si la autorización falla', async () => {
    requireRole.mockRejectedValueOnce(new Error('No autorizado'));
    await expect(setClientMaintenanceActive(true)).rejects.toThrow('No autorizado');
    expect(create).not.toHaveBeenCalled();
  });
});
