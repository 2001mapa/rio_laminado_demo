import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createUser: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  logAuditEvent: vi.fn(),
}));

vi.mock('@/utils/auth-helpers', () => ({ requireRole: h.requireRole }));
vi.mock('@/lib/audit', () => ({ getAuditActor: vi.fn().mockResolvedValue({ id: 'owner', role: 'admin', name: 'Principal' }), logAuditEvent: h.logAuditEvent }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { admin: {
    createUser: h.createUser,
    listUsers: h.listUsers,
    getUserById: h.getUserById,
    updateUserById: h.updateUserById,
  } } }),
}));

import { canManageAdmins, createAdministrator, getAdministratorProfile, listAdministrators, resetAdministratorPassword, setAdministratorDisabled } from '@/app/actions/admins';

const adminId = '11111111-1111-4111-8111-111111111111';

describe('gestión de administradores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PRIMARY_ADMIN_USER_ID', 'owner');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only');
    h.requireRole.mockResolvedValue({ user: { id: 'owner' }, role: 'admin' });
  });
  afterEach(() => vi.unstubAllEnvs());

  it('niega crear o listar desde otro admin', async () => {
    h.requireRole.mockResolvedValue({ user: { id: 'other' }, role: 'admin' });
    expect(await canManageAdmins()).toBe(false);
    await expect(listAdministrators()).rejects.toThrow('cuenta principal');
    await expect(createAdministrator({ name: 'Ana', email: 'ana@rio.com', password: 'ClaveRio123' })).rejects.toThrow('cuenta principal');
    await expect(getAdministratorProfile(adminId)).rejects.toThrow('cuenta principal');
    await expect(resetAdministratorPassword(adminId, 'ClaveNueva123')).rejects.toThrow('cuenta principal');
    expect(h.getUserById).not.toHaveBeenCalled();
    expect(h.createUser).not.toHaveBeenCalled();
  });

  it('muestra solo los datos permitidos de otro administrador a la cuenta principal', async () => {
    h.getUserById.mockResolvedValue({ data: { user: {
      id: adminId,
      email: 'ana@rio.com',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-02T10:00:00Z',
      last_sign_in_at: '2026-10-02T09:00:00Z',
      email_confirmed_at: '2026-10-01T10:00:00Z',
      user_metadata: { name: 'Ana' },
      app_metadata: { role: 'admin', adminDisabled: false },
      encrypted_password: 'never-expose',
    } }, error: null });

    const profile = await getAdministratorProfile(adminId);
    expect(profile).toMatchObject({ id: adminId, email: 'ana@rio.com', name: 'Ana', primary: false, disabled: false });
    expect(profile).not.toHaveProperty('encrypted_password');
    expect(h.getUserById).toHaveBeenCalledWith(adminId);
  });

  it('no expone perfiles sin rol admin', async () => {
    h.getUserById.mockResolvedValue({ data: { user: { app_metadata: { role: 'cliente' } } }, error: null });
    expect(await getAdministratorProfile(adminId)).toBeNull();
  });

  it('crea el rol únicamente en app_metadata', async () => {
    h.createUser.mockResolvedValue({ data: { user: { id: 'new-admin' } }, error: null });
    const result = await createAdministrator({ name: ' Ana ', email: ' ANA@RIO.COM ', password: 'ClaveRio123' });
    expect(result).toEqual({ success: true, id: 'new-admin' });
    expect(h.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'ana@rio.com',
      app_metadata: { role: 'admin', adminDisabled: false },
      user_metadata: { name: 'Ana' },
    }));
  });

  it('no permite suspender la cuenta principal ni cuentas sin rol admin', async () => {
    expect((await setAdministratorDisabled('owner', true)).success).toBe(false);
    expect(h.updateUserById).not.toHaveBeenCalled();
    h.getUserById.mockResolvedValue({ data: { user: { app_metadata: { role: 'cliente' } } }, error: null });
    expect((await setAdministratorDisabled('customer', true)).success).toBe(false);
    expect(h.updateUserById).not.toHaveBeenCalled();
  });

  it('suspende otro admin conservando sus metadatos', async () => {
    h.getUserById.mockResolvedValue({ data: { user: { app_metadata: { role: 'admin', provider: 'email' } } }, error: null });
    h.updateUserById.mockResolvedValue({ error: null });
    expect(await setAdministratorDisabled('other', true)).toEqual({ success: true });
    expect(h.updateUserById).toHaveBeenCalledWith('other', {
      app_metadata: { role: 'admin', provider: 'email', adminDisabled: true },
    });
  });

  it('restablece solo claves de administradores secundarios y audita sin incluir la clave', async () => {
    h.getUserById.mockResolvedValue({ data: { user: { app_metadata: { role: 'admin' } } }, error: null });
    h.updateUserById.mockResolvedValue({ error: null });
    expect(await resetAdministratorPassword(adminId, 'ClaveNueva123')).toEqual({ success: true });
    expect(h.updateUserById).toHaveBeenCalledWith(adminId, { password: 'ClaveNueva123' });
    expect(h.logAuditEvent).toHaveBeenCalledWith(expect.anything(), {
      action: 'RESET_ADMIN_PASSWORD', entityType: 'ADMIN', entityId: adminId,
    });
  });

  it('rechaza la cuenta principal, las claves débiles y cuentas de otros roles', async () => {
    expect((await resetAdministratorPassword('owner', 'ClaveNueva123')).success).toBe(false);
    expect((await resetAdministratorPassword(adminId, 'debil')).success).toBe(false);
    h.getUserById.mockResolvedValue({ data: { user: { app_metadata: { role: 'cliente' } } }, error: null });
    expect((await resetAdministratorPassword(adminId, 'ClaveNueva123')).success).toBe(false);
    expect(h.updateUserById).not.toHaveBeenCalled();
  });
});
