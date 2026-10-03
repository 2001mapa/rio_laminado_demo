import { describe, it, expect, vi } from 'vitest';
import { createOrder } from '@/app/actions/orders';
import { updateCustomerInternalStatus } from '@/app/actions/clients';

vi.mock('@/utils/auth-helpers', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, role: 'admin' })
}));

const mockPrismaProduct = {
  id: 'prod-1',
  sku: 'TEST-SKU',
  price: 100,
  physicalStock: 10,
  reservedStock: 2,
  isActive: true,
  material: 'Oro',
  category: 'Collares'
};

const mockTxCustomerCreate = vi.fn().mockResolvedValue({ id: 'new-cust-1' });

vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn(),
  getAuditActor: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'admin', type: 'user' })
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { 
      findUnique: vi.fn().mockResolvedValue({ id: 'cust-1', name: 'Mock Customer', internalSystemStatus: 'Pendiente' }),
      update: vi.fn().mockResolvedValue({ id: 'cust-1', internalSystemStatus: 'Registrado' })
    },
    order: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn(async (cb) => {
      // simulate the transaction callback execution
      return await cb({
        customer: { create: mockTxCustomerCreate },
        product: { findUnique: vi.fn().mockResolvedValue(mockPrismaProduct), update: vi.fn().mockResolvedValue(mockPrismaProduct) },
        order: { create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }), findFirst: vi.fn().mockResolvedValue(null), findUnique: vi.fn().mockResolvedValue(null) },
        orderItem: { createMany: vi.fn() },
        orderMaterialGroup: { create: vi.fn().mockResolvedValue({ id: 'g1' }) }
      });
    })
  }
}));

describe('Phase 6: Venta Rapida Server (Mocks)', () => {
  it('crea el cliente dentro de la transaccion si es NEW_CUSTOMER', async () => {
    const res = await createOrder({
      customerId: 'NEW_CUSTOMER',
      items: [{ productId: 'prod-1', quantity: 1, expectedPrice: 100 }],
      newCustomerData: { name: 'Juan', phone: '123', city: 'A', address: 'B' }
    });
    
    expect(res.success).toBe(true);
    expect(mockTxCustomerCreate).toHaveBeenCalledWith({
      data: {
        name: 'Juan',
        phone: '123',
        city: 'A',
        address: 'B',
        email: null,
        internalSystemStatus: 'Pendiente'
      }
    });
  });

  it('cambio de estado ERP de cliente', async () => {
    const res = await updateCustomerInternalStatus('cust-1', 'Registrado');
    expect(res.success).toBe(true);
    // Prisma update is mocked above
  });
});
