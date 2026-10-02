import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrder } from '@/app/actions/orders';

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

const mockPrismaFindUnique = vi.fn().mockResolvedValue(mockPrismaProduct);
const mockPrismaFindMany = vi.fn().mockResolvedValue([mockPrismaProduct]);
const mockPrismaUpdate = vi.fn();

vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn(),
  getAuditActor: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'admin', type: 'user' })
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findUnique: vi.fn().mockResolvedValue({ id: 'cust-1', name: 'Mock Customer' }) },
    product: {
      findUnique: (...args: any) => mockPrismaFindUnique(...args),
      findMany: (...args: any) => mockPrismaFindMany(...args),
    },
    order: {
      create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }),
      findFirst: vi.fn().mockResolvedValue(null)
    },
    $transaction: vi.fn((cb) => cb({
      product: {
        findUnique: (...args: any) => mockPrismaFindUnique(...args),
        update: (...args: any) => {
           mockPrismaUpdate(...args);
           return mockPrismaProduct;
        }
      },
      order: {
        create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' }),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'WEB-0001' })
      },
      orderItem: {
        createMany: vi.fn()
      },
      orderMaterialGroup: {
        create: vi.fn().mockResolvedValue({ id: 'group-1' })
      },
      auditEvent: {
        create: vi.fn()
      }
    }))
  }
}));

describe('Phase 5: Server Conflict Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe devolver CONFLICT_ERROR si expectedPrice es distinto al precio actual del producto', async () => {
    const data = {
      customerId: 'cust-1',
      items: [
        { productId: 'prod-1', quantity: 2, expectedPrice: 80 } // Precio esperado 80, pero en DB es 100
      ]
    };

    const result = await createOrder(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('CONFLICT_ERROR');
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts![0].reason).toBe('El precio ha cambiado');
      expect(result.conflicts![0].currentPrice).toBe(100);
    }
  });

  it('debe devolver CONFLICT_ERROR si la cantidad excede el stock disponible', async () => {
    const data = {
      customerId: 'cust-1',
      items: [
        { productId: 'prod-1', quantity: 20, expectedPrice: 100 } // available is 10 - 2 = 8
      ]
    };

    const result = await createOrder(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('CONFLICT_ERROR');
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts![0].reason).toBe('Stock insuficiente');
      expect(result.conflicts![0].currentStock).toBe(8);
    }
  });

  it('debe crear el pedido si no hay conflictos', async () => {
     const data = {
      customerId: 'cust-1',
      items: [
        { productId: 'prod-1', quantity: 2, expectedPrice: 100 } // matches available and price
      ]
    };

    const result = await createOrder(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.order).toBeDefined();
    }
  });
});
