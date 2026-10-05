import { describe, expect, it, vi } from 'vitest';
import { executeSync } from '@/lib/useOfflineSync';
import type { PendingOrder } from '@/lib/offlineQueue';

describe('cola de venta rápida', () => {
  it('reenvía los mismos datos y UUID después de perder la respuesta', async () => {
    const order: PendingOrder = {
      clientRequestId: 'same-uuid', sellerId: 'seller-auth', customerId: 'NEW_CUSTOMER',
      customerName: 'Joyería Nueva',
      newCustomerData: { name: 'Joyería Nueva', phone: '3124560359', city: 'Medellín', address: 'Calle 10 # 20-30' },
      items: [{ productId: 'product-1', quantity: 1, expectedPrice: 100 }],
      status: 'pending', retryCount: 0, createdAt: Date.now()
    };
    const queue = [order];
    const createOrderAction = vi.fn()
      .mockRejectedValueOnce(new Error('Respuesta perdida'))
      .mockResolvedValueOnce({ success: true, order: { orderNumber: 'VEN-0001' } });
    const deps = {
      getPendingOrders: vi.fn(async () => queue),
      updatePendingOrderStatus: vi.fn(async (_id: string, update: Partial<PendingOrder>) => { Object.assign(order, update); }),
      removePendingOrder: vi.fn(async () => { queue.length = 0; }),
      createOrderAction,
      checkOrderByRequestId: vi.fn(async () => ({ success: false, notFound: true }))
    };

    await executeSync('seller-auth', vi.fn(), 'same-uuid', deps);
    expect(order.status).toBe('failed_recoverable');
    expect(queue).toHaveLength(1);
    await executeSync('seller-auth', vi.fn(), 'same-uuid', deps);
    expect(createOrderAction).toHaveBeenCalledTimes(2);
    expect(createOrderAction.mock.calls[0][0]).toMatchObject({ clientRequestId: 'same-uuid', newCustomerData: order.newCustomerData });
    expect(createOrderAction.mock.calls[1][0]).toEqual(createOrderAction.mock.calls[0][0]);
    expect(queue).toHaveLength(0);
  });
});
