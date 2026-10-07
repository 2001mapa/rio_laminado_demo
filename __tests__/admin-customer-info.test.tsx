import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  requireRole: vi.fn(),
  customerFindUnique: vi.fn(),
  orderFindMany: vi.fn(),
  getUserById: vi.fn(),
  getAdminDashboard: vi.fn(),
}));

vi.mock('@/utils/auth-helpers', () => ({ requireRole: h.requireRole }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findUnique: h.customerFindUnique },
    order: { findMany: h.orderFindMany },
  },
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { admin: { getUserById: h.getUserById } } }),
}));
vi.mock('@/lib/audit', () => ({ getAuditActor: vi.fn(), logAuditEvent: vi.fn() }));
vi.mock('@/app/actions/queries', () => ({ getAdminDashboard: h.getAdminDashboard }));

import { getCustomerProfile } from '@/app/actions/clients';
import AdminDashboard from '@/app/admin/page';

const customerId = 'customer-1';
const authUserId = 'auth-1';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-server-only-key');
  h.requireRole.mockResolvedValue({ role: 'admin' });
  h.customerFindUnique.mockResolvedValue({ authUserId });
  h.orderFindMany.mockResolvedValue([{ id: 'order-1', orderNumber: 'WEB-0001' }]);
  h.getUserById.mockResolvedValue({ data: { user: { last_sign_in_at: '2026-10-07T14:00:00.000Z' } }, error: null });
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('Datos del cliente en admin', () => {
  it('consulta el último acceso en el servidor solo para el administrador', async () => {
    const result = await getCustomerProfile(customerId);
    expect(result).toMatchObject({ success: true, lastSignInAt: '2026-10-07T14:00:00.000Z', orders: [{ number: 'WEB-0001' }] });
    expect(h.getUserById).toHaveBeenCalledWith(authUserId);

    h.requireRole.mockResolvedValue({ role: 'vendedor' });
    const sellerResult = await getCustomerProfile(customerId);
    expect(sellerResult).toMatchObject({ success: true, lastSignInAt: null });
    expect(h.getUserById).toHaveBeenCalledTimes(1);
  });

  it('distingue ausencia de inicio de sesión de una consulta no disponible', async () => {
    h.getUserById.mockResolvedValueOnce({ data: { user: { last_sign_in_at: null } }, error: null });
    expect((await getCustomerProfile(customerId)).lastSignInAt).toBeNull();

    h.getUserById.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth unavailable') });
    expect((await getCustomerProfile(customerId)).lastSignInAt).toBeUndefined();
  });

  it('muestra la dirección de envío si no hay ciudad registrada', async () => {
    h.getAdminDashboard.mockResolvedValue({
      success: true,
      data: {
        reserved: 0, olderReserved: 0, pendingErp: 0, outOfStockCount: 0,
        lowStockCount: 0, lastInventoryUpdate: null, directOrders: [], sellerOrders: [],
        urgentCount: 0, urgentOrders: [], currentOrders: 1, previousOrders: 0,
        totalUnits: 1, topProducts: [],
        topClients: [{ id: customerId, name: 'Joyería de Prueba', city: null, address: 'Colombia, Medellín Antioquia', orderCount: 1 }],
      },
    });

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText('Envío: Colombia, Medellín Antioquia')).toBeTruthy());
    expect(screen.queryByText('Ciudad no registrada')).toBeNull();
  });
});
