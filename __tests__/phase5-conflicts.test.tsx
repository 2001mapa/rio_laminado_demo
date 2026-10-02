import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSync } from '@/lib/useOfflineSync';
import { PendingOrder } from '@/lib/offlineQueue';

describe('Phase 5: Offline Sync and Conflict Resolution', () => {
  let pendingOrders: PendingOrder[] = [];
  let updatedStatus: Record<string, any> = {};
  
  const mockDeps = {
    getPendingOrders: vi.fn(async () => pendingOrders),
    updatePendingOrderStatus: vi.fn(async (id, update) => {
      updatedStatus[id] = { ...(updatedStatus[id] || {}), ...update };
      const order = pendingOrders.find(o => o.clientRequestId === id);
      if (order) Object.assign(order, update);
    }),
    removePendingOrder: vi.fn(async (id) => {
      pendingOrders = pendingOrders.filter(o => o.clientRequestId !== id);
    }),
    createOrderAction: vi.fn(),
    checkOrderByRequestId: vi.fn(async () => ({ success: false, notFound: true }))
  };

  beforeEach(() => {
    pendingOrders = [];
    updatedStatus = {};
    vi.clearAllMocks();
  });

  it('debe marcar pedido como conflict y no borrarlo si el servidor reporta CONFLICT_ERROR (Stock insuficiente)', async () => {
    pendingOrders = [{
      clientRequestId: 'uuid-conflict-1',
      sellerId: 's1',
      customerId: 'c1',
      customerName: 'Cust',
      items: [{ productId: 'p1', quantity: 10, expectedPrice: 100 }],
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0
    }];

    mockDeps.createOrderAction.mockResolvedValueOnce({
      success: false,
      code: 'CONFLICT_ERROR',
      error: 'Conflictos en el inventario o precios.',
      conflicts: [{ productId: 'p1', reason: 'Stock insuficiente', currentStock: 2 }]
    });

    await executeSync('s1', vi.fn(), undefined, mockDeps);

    expect(updatedStatus['uuid-conflict-1'].status).toBe('conflict');
    expect(updatedStatus['uuid-conflict-1'].conflicts[0].currentStock).toBe(2);
    expect(pendingOrders.length).toBe(1); // No borrado!
  });

  it('debe registrar conflicto si un producto está desactivado o cambiado de precio', async () => {
    pendingOrders = [{
      clientRequestId: 'uuid-conflict-price',
      sellerId: 's1',
      customerId: 'c1',
      customerName: 'Cust',
      items: [{ productId: 'p2', quantity: 1, expectedPrice: 100 }],
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0
    }];

    mockDeps.createOrderAction.mockResolvedValueOnce({
      success: false,
      code: 'CONFLICT_ERROR',
      conflicts: [{ productId: 'p2', reason: 'El precio ha cambiado', currentPrice: 120, currentStock: 10 }]
    });

    await executeSync('s1', vi.fn(), undefined, mockDeps);

    expect(updatedStatus['uuid-conflict-price'].status).toBe('conflict');
    expect(updatedStatus['uuid-conflict-price'].conflicts[0].currentPrice).toBe(120);
    expect(pendingOrders.length).toBe(1);
  });
});
