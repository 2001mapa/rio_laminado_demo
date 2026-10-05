import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrder } from '@/app/actions/orders';

const state = vi.hoisted(() => ({
  existing: null as any,
  createdCustomer: null as any,
  createdOrder: null as any,
  stock: 5,
}));

vi.mock('@/utils/auth-helpers', () => ({
  requireRole: vi.fn(async () => ({ user: { id: 'auth-seller' }, role: 'vendedor' }))
}));

vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn(),
  getAuditActor: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    seller: { findUnique: vi.fn(async () => ({ id: 'seller-1', status: 'active' })) },
    customer: { findUnique: vi.fn(async () => null) },
    order: { findUnique: vi.fn(async () => state.existing) },
    $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
      const tx = {
        customer: { create: vi.fn(async ({ data }: any) => {
          state.createdCustomer = { id: 'customer-new', ...data };
          return state.createdCustomer;
        }) },
        product: {
          findUnique: vi.fn(async () => ({ id: 'product-1', name: 'Cadena', category: 'Collares', material: 'Laminado', price: 100, physicalStock: state.stock, reservedStock: 0, isActive: true })),
          update: vi.fn(async () => ({ physicalStock: state.stock, reservedStock: 1 }))
        },
        order: {
          findFirst: vi.fn(async () => null),
          create: vi.fn(async ({ data }: any) => {
            state.createdOrder = { id: 'order-1', ...data };
            return state.createdOrder;
          }),
          findUnique: vi.fn(async () => ({ ...state.createdOrder, items: [], groups: [] }))
        },
        orderMaterialGroup: { create: vi.fn(async () => ({ id: 'group-1' })) },
        orderItem: { createMany: vi.fn(async () => ({})) }
      };
      const result = await callback(tx);
      state.existing = result;
      return result;
    })
  }
}));

const quickCustomer = { name: '  Joyería Nueva  ', phone: '3124560359', city: 'Medellín', address: 'Calle 10 # 20-30' };
const payload = { customerId: 'NEW_CUSTOMER', newCustomerData: quickCustomer, clientRequestId: 'uuid-quick-1', items: [{ productId: 'product-1', quantity: 1, expectedPrice: 100 }] };

describe('venta rápida en la acción real con Prisma aislado', () => {
  beforeEach(() => {
    state.existing = null;
    state.createdCustomer = null;
    state.createdOrder = null;
    state.stock = 5;
  });

  it('crea el cliente sin acceso al portal dentro de la transacción y conserva el UUID', async () => {
    const result = await createOrder(payload);
    expect(result.success).toBe(true);
    expect(state.createdCustomer).toMatchObject({ name: 'Joyería Nueva', internalSystemStatus: 'Pendiente' });
    expect(state.createdCustomer.authUserId).toBeUndefined();
    expect(state.createdOrder).toMatchObject({ customerId: 'customer-new', clientRequestId: 'uuid-quick-1' });
    expect(state.createdOrder.originalPayload.newCustomerData.name).toBe('Joyería Nueva');

    const retry = await createOrder(payload);
    expect(retry.success).toBe(true);
    expect(retry.order?.id).toBe(result.order?.id);
  });

  it('no crea cliente cuando el producto no tiene stock', async () => {
    state.stock = 0;
    const result = await createOrder(payload);
    expect(result.success).toBe(false);
    expect(result.code).toBe('CONFLICT_ERROR');
    expect(state.createdCustomer).toBeNull();
  });

  it('rechaza reutilizar el UUID para datos de otro cliente', async () => {
    await createOrder(payload);
    const result = await createOrder({ ...payload, newCustomerData: { ...quickCustomer, phone: '3001112222' } });
    expect(result.success).toBe(false);
    expect(result.code).toBe('BUSINESS_ERROR');
  });
});
