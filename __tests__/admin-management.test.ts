import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createUser: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock('@/utils/auth-helpers', () => ({ requireRole: h.requireRole }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { admin: {
    createUser: h.createUser,
    listUsers: h.listUsers,
    getUserById: h.getUserById,
    updateUserById: h.updateUserById,
  } } }),
}));

import { canManageAdmins, createAdministrator, listAdministrators, setAdministratorDisabled } from '@/app/actions/admins';

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
    expect(h.createUser).not.toHaveBeenCalled();
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
});
