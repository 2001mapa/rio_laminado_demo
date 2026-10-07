import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  requireRole: vi.fn(),
  customerFindUnique: vi.fn(),
  orderFindMany: vi.fn(),
  orderFindUnique: vi.fn(),
  orderUpdate: vi.fn(),
  auditFindMany: vi.fn(),
  demoData: null as any,
}));

vi.mock('next/cache', () => ({ unstable_noStore: vi.fn() }));
vi.mock('@/utils/auth-helpers', () => ({ requireRole: h.requireRole }));
vi.mock('@/lib/prisma', () => {
  const prisma = {
    customer: { findUnique: h.customerFindUnique },
    order: { findMany: h.orderFindMany, findUnique: h.orderFindUnique, update: h.orderUpdate },
    auditEvent: { findMany: h.auditFindMany },
  };
  return { prisma: { ...prisma, $transaction: async (callback: (tx: typeof prisma) => unknown) => callback(prisma) } };
});
vi.mock('@/lib/audit', () => ({
  getAuditActor: vi.fn().mockResolvedValue({ id: 'customer-auth', role: 'cliente' }),
  logAuditEvent: vi.fn(),
}));
vi.mock('@/lib/DemoContext', () => ({ useDemo: () => h.demoData }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { signOut: vi.fn() } }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { getAppData, getClientOrderStatuses } from '@/app/actions/queries';
import { acknowledgeOrderAdjustment, getOrderById, transitionOrder } from '@/app/actions/orders';
import ClientePerfilPage from '@/app/cliente/perfil/page';
import ClientePedidoPage from '@/app/cliente/pedido/[id]/page';

const customer = { id: 'customer-1', authUserId: 'customer-auth', name: 'Joyería de Prueba', email: 'cliente@example.com', phone: '123', address: 'Medellín', discount: 0, showDiscount: false };
const directOrder = { id: 'direct-1', number: 'WEB-0001', orderNumber: 'WEB-0001', customerId: customer.id, sellerId: null, status: 'Reservado', createdAt: '2026-10-06T12:00:00.000Z', items: [] };
const sellerOrder = { ...directOrder, id: 'seller-1', number: 'VEN-0001', orderNumber: 'VEN-0001', sellerId: 'seller-1' };

beforeEach(() => {
  vi.clearAllMocks();
  h.requireRole.mockResolvedValue({ user: { id: customer.authUserId }, role: 'cliente' });
  h.customerFindUnique.mockResolvedValue(customer);
  h.orderFindMany.mockResolvedValue([directOrder]);
  h.auditFindMany.mockResolvedValue([]);
  h.demoData = { currentCustomer: customer, orders: [directOrder, sellerOrder], products: [], isLoaded: true, transitionOrder: vi.fn(), acknowledgeAdjustment: vi.fn() };
});

afterEach(cleanup);

describe('Pedidos visibles para el cliente', () => {
  it('consulta solo pedidos directos en datos y alertas', async () => {
    await getAppData();
    expect(h.orderFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: customer.id, sellerId: null },
    }));

    await getClientOrderStatuses();
    expect(h.orderFindMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { customerId: customer.id, sellerId: null },
    }));
  });

  it('no muestra ventas del asesor en el historial ni por enlace directo', async () => {
    render(<ClientePerfilPage />);
    expect(screen.getByText('WEB-0001')).toBeTruthy();
    expect(screen.queryByText('VEN-0001')).toBeNull();
    cleanup();

    await act(async () => {
      render(<Suspense fallback={<p>Cargando</p>}><ClientePedidoPage params={Promise.resolve({ id: sellerOrder.id })} /></Suspense>);
    });
    await waitFor(() => expect(screen.getByText('Pedido no encontrado')).toBeTruthy());
    expect(screen.queryByText('VEN-0001')).toBeNull();
  });

  it('rechaza lectura, cancelación y acuse de ajustes de una venta del asesor', async () => {
    h.orderFindUnique.mockResolvedValue({ ...sellerOrder, customer });

    const read = await getOrderById(sellerOrder.id);
    expect(read).toMatchObject({ success: false, message: 'Acceso denegado a este pedido' });

    const cancel = await transitionOrder(sellerOrder.id, 'CANCEL');
    expect(cancel.success).toBe(false);

    const acknowledge = await acknowledgeOrderAdjustment(sellerOrder.id);
    expect(acknowledge.success).toBe(false);
    expect(h.orderUpdate).toHaveBeenCalledTimes(0);
  });

  it('conserva el acceso al detalle y al acuse de los pedidos propios', async () => {
    h.orderFindUnique.mockResolvedValue({ ...directOrder, customer });
    h.orderUpdate.mockResolvedValue(directOrder);

    const read = await getOrderById(directOrder.id);
    expect(read).toMatchObject({ success: true, order: { number: directOrder.number } });

    const acknowledge = await acknowledgeOrderAdjustment(directOrder.id);
    expect(acknowledge.success).toBe(true);
    expect(h.orderUpdate).toHaveBeenCalledWith({
      where: { id: directOrder.id },
      data: { adjustmentAcknowledged: true },
    });
  });
});
