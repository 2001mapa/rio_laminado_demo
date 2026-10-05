import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks (vi.hoisted: se evalúan antes que los imports estáticos) ---
const h = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
  findUnique: vi.fn(),
  sellerCreate: vi.fn(),
  requireRole: vi.fn(),
  logAuditEvent: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { admin: { createUser: h.createUser, updateUserById: h.updateUserById, deleteUser: h.deleteUser } },
  }),
}));

vi.mock('@/lib/prisma', () => {
  const prisma: any = {
    seller: { findUnique: h.findUnique, create: h.sellerCreate },
  };
  prisma.$transaction = vi.fn(async (cb: any) => cb(prisma));
  return { prisma };
});

vi.mock('@/utils/auth-helpers', () => ({ requireRole: h.requireRole }));

vi.mock('@/lib/audit', () => ({
  logAuditEvent: h.logAuditEvent,
  getAuditActor: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'admin', name: 'Admin' }),
}));

import { createSeller, resetSellerPassword } from '@/app/actions/sellers';
import { validatePassword, generatePassword } from '@/lib/passwordPolicy';

const MANUAL = 'Rio Clave 2026xY'; // con espacios: debe llegar intacta, sin recortes
const NEW_PW = 'NuevaClave9z';

let consoleSpies: ReturnType<typeof vi.spyOn>[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  h.requireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
  consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(m =>
    vi.spyOn(console, m).mockImplementation(() => {})
  );
});

afterEach(() => {
  // Ninguna contraseña debe aparecer jamás en logs.
  for (const spy of consoleSpies) {
    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).not.toContain(MANUAL);
    expect(logged).not.toContain(NEW_PW);
  }
  consoleSpies.forEach(s => s.mockRestore());
});

function auditPayloads() {
  return JSON.stringify(h.logAuditEvent.mock.calls);
}

describe('passwordPolicy (regla compartida UI/servidor)', () => {
  it('aplica mínimo 8, mayúscula, minúscula y número', () => {
    expect(validatePassword('')).toMatch(/obligatoria/);
    expect(validatePassword('Abc1234')).not.toBeNull();      // 7 caracteres
    expect(validatePassword('abcdefg1')).not.toBeNull();     // sin mayúscula
    expect(validatePassword('ABCDEFG1')).not.toBeNull();     // sin minúscula
    expect(validatePassword('Abcdefgh')).not.toBeNull();     // sin número
    expect(validatePassword('Abcdefg1')).toBeNull();
  });

  it('el generador opcional siempre cumple la regla', () => {
    for (let i = 0; i < 200; i++) expect(validatePassword(generatePassword())).toBeNull();
  });
});

describe('createSeller', () => {
  it('la contraseña manual llega intacta a createUser con rol vendedor', async () => {
    h.findUnique.mockResolvedValueOnce(null);
    h.createUser.mockResolvedValueOnce({ data: { user: { id: 'auth-123' } }, error: null });
    h.sellerCreate.mockResolvedValueOnce({ id: 'seller-1', email: 'v@rio.com' });

    const res: any = await createSeller({ name: 'Vendedor', email: 'V@Rio.com', password: MANUAL });

    expect(res.success).toBe(true);
    expect(h.requireRole).toHaveBeenCalledWith(['admin']);
    expect(h.createUser).toHaveBeenCalledTimes(1);
    const args = h.createUser.mock.calls[0][0];
    expect(args.password).toBe(MANUAL);
    expect(args.app_metadata).toEqual({ role: 'vendedor' });
    // La clave no se guarda en Prisma ni se devuelve desde el servidor
    expect(JSON.stringify(h.sellerCreate.mock.calls)).not.toContain(MANUAL);
    expect(JSON.stringify(res)).not.toContain(MANUAL);
    expect(auditPayloads()).not.toContain(MANUAL);
  });

  it('rechaza una clave débil en el servidor sin crear usuario', async () => {
    for (const weak of ['', 'corta1A', 'sinmayuscula1', 'SINMINUSCULA1', 'SinNumeros']) {
      const res: any = await createSeller({ name: 'V', email: 'v@rio.com', password: weak });
      expect(res.success).toBe(false);
    }
    expect(h.createUser).not.toHaveBeenCalled();
    expect(h.findUnique).not.toHaveBeenCalled();
    expect(h.logAuditEvent).not.toHaveBeenCalled();
  });

  it('muestra un error claro si Supabase exige una política más estricta', async () => {
    h.findUnique.mockResolvedValueOnce(null);
    h.createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { code: 'weak_password', message: 'Password should contain at least one special character' },
    });

    const res: any = await createSeller({ name: 'V', email: 'v@rio.com', password: MANUAL });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/política de seguridad/);
    expect(res.message).not.toMatch(/ya existe/);
    expect(h.sellerCreate).not.toHaveBeenCalled();
  });

  it('si falla Prisma, compensa borrando el usuario de Auth y no reporta éxito', async () => {
    h.findUnique.mockResolvedValueOnce(null);
    h.createUser.mockResolvedValueOnce({ data: { user: { id: 'auth-xyz' } }, error: null });
    h.sellerCreate.mockRejectedValueOnce(new Error('db down'));
    h.deleteUser.mockResolvedValueOnce({ error: null });

    const res: any = await createSeller({ name: 'V', email: 'v@rio.com', password: MANUAL });
    expect(res.success).toBe(false);
    expect(h.deleteUser).toHaveBeenCalledWith('auth-xyz');
  });
});

describe('resetSellerPassword', () => {
  it('usa el authUserId del vendedor buscado por ID en el servidor', async () => {
    h.findUnique.mockResolvedValueOnce({ id: 'seller-1', authUserId: 'auth-real-id' });
    h.updateUserById.mockResolvedValueOnce({ data: {}, error: null });

    const res: any = await resetSellerPassword('seller-1', NEW_PW);

    expect(res.success).toBe(true);
    expect(h.findUnique).toHaveBeenCalledWith({ where: { id: 'seller-1' } });
    expect(h.updateUserById).toHaveBeenCalledWith('auth-real-id', { password: NEW_PW });
    expect(auditPayloads()).toContain('RESET_SELLER_PASSWORD');
    expect(auditPayloads()).not.toContain(NEW_PW);
  });

  it('rechaza clave débil sin consultar ni tocar Auth', async () => {
    const res: any = await resetSellerPassword('seller-1', 'debil');
    expect(res.success).toBe(false);
    expect(h.findUnique).not.toHaveBeenCalled();
    expect(h.updateUserById).not.toHaveBeenCalled();
  });

  it('sin authUserId devuelve error y no llama a Auth', async () => {
    h.findUnique.mockResolvedValueOnce({ id: 'seller-1', authUserId: null });
    const res: any = await resetSellerPassword('seller-1', NEW_PW);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/authUserId/);
    expect(h.updateUserById).not.toHaveBeenCalled();
  });

  it('vendedor inexistente devuelve error', async () => {
    h.findUnique.mockResolvedValueOnce(null);
    const res: any = await resetSellerPassword('nope', NEW_PW);
    expect(res.success).toBe(false);
    expect(h.updateUserById).not.toHaveBeenCalled();
  });

  it('un fallo de Auth no se reporta como éxito ni se audita', async () => {
    h.findUnique.mockResolvedValueOnce({ id: 'seller-1', authUserId: 'auth-real-id' });
    h.updateUserById.mockResolvedValueOnce({ data: null, error: { message: 'Service unavailable' } });

    const res: any = await resetSellerPassword('seller-1', NEW_PW);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/NO fue cambiada/);
    expect(h.logAuditEvent).not.toHaveBeenCalled();
  });

  it('una excepción de Auth tampoco se reporta como éxito', async () => {
    h.findUnique.mockResolvedValueOnce({ id: 'seller-1', authUserId: 'auth-real-id' });
    h.updateUserById.mockRejectedValueOnce(new Error('network'));
    const res: any = await resetSellerPassword('seller-1', NEW_PW);
    expect(res.success).toBe(false);
  });

  it('política estricta de Supabase en el restablecimiento da un error claro', async () => {
    h.findUnique.mockResolvedValueOnce({ id: 'seller-1', authUserId: 'auth-real-id' });
    h.updateUserById.mockResolvedValueOnce({ data: null, error: { code: 'weak_password', message: 'Password is too weak' } });
    const res: any = await resetSellerPassword('seller-1', NEW_PW);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/política de seguridad/);
  });

  it('si Auth cambió la clave pero falla la auditoría, informa éxito con advertencia (no un falso error)', async () => {
    h.findUnique.mockResolvedValueOnce({ id: 'seller-1', authUserId: 'auth-real-id' });
    h.updateUserById.mockResolvedValueOnce({ data: {}, error: null });
    h.logAuditEvent.mockRejectedValueOnce(new Error('audit down'));

    const res: any = await resetSellerPassword('seller-1', NEW_PW);
    expect(res.success).toBe(true);
    expect(res.auditWarning).toMatch(/auditoría/);
  });
});

describe('autorización', () => {
  it('un usuario no admin no puede ejecutar ninguna acción', async () => {
    h.requireRole.mockRejectedValue(new Error('Unauthorized'));

    await expect(createSeller({ name: 'A', email: 'a@rio.com', password: MANUAL })).rejects.toThrow('Unauthorized');
    await expect(resetSellerPassword('seller-1', NEW_PW)).rejects.toThrow('Unauthorized');

    expect(h.createUser).not.toHaveBeenCalled();
    expect(h.updateUserById).not.toHaveBeenCalled();
    expect(h.findUnique).not.toHaveBeenCalled();
    expect(h.logAuditEvent).not.toHaveBeenCalled();
  });
});
