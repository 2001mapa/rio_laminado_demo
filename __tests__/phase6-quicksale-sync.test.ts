import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSync } from '@/lib/useOfflineSync';
import { v4 as uuidv4 } from 'uuid';

describe('Phase 6: Venta Rapida Sync', () => {
  let mockDeps: any;
  let sellerId = 'seller-test-sync';

  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true });
    mockDeps = {
      getPendingOrders: vi.fn(),
      updatePendingOrderStatus: vi.fn(),
      removePendingOrder: vi.fn(),
      createOrderAction: vi.fn(),
      checkOrderByRequestId: vi.fn().mockResolvedValue({ success: false, notFound: true })
    };
  });

  it('debe mantener UUID y newCustomerData tras error recuperable de red y limpiar cola solo al éxito', async () => {
    const reqId = uuidv4();
    const mockOrder = {
      clientRequestId: reqId, sellerId, customerId: 'NEW_CUSTOMER', customerName: 'Cliente Retry',
      newCustomerData: { name: 'Cliente Retry', phone: '333', city: 'MED', address: 'Calle Retry' },
      items: [{ productId: 'p1', quantity: 2, expectedPrice: 200 }],
      status: 'pending', createdAt: Date.now() - 10000, retryCount: 0, totalAmount: 400
    };

    // 1. Simular error de red (throw)
    mockDeps.getPendingOrders.mockResolvedValue([mockOrder]);
    mockDeps.createOrderAction.mockRejectedValueOnce(new Error('Network Error'));
    
    await executeSync(sellerId, vi.fn(), undefined, mockDeps);
    
    expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(1);
    expect(mockDeps.createOrderAction).toHaveBeenCalledWith(expect.objectContaining({ clientRequestId: reqId, newCustomerData: mockOrder.newCustomerData }));
    expect(mockDeps.removePendingOrder).not.toHaveBeenCalled();
    expect(mockDeps.updatePendingOrderStatus).toHaveBeenCalledWith(reqId, expect.objectContaining({ status: 'failed_recoverable' }));

    // 2. Simular éxito en el reintento
    const retryOrder = { ...mockOrder, status: 'failed_recoverable', retryCount: 1, nextRetryAt: Date.now() - 1000 };
    mockDeps.getPendingOrders.mockResolvedValue([retryOrder]);
    mockDeps.createOrderAction.mockResolvedValueOnce({ success: true, order: { orderNumber: 'WEB-999' } });

    await executeSync(sellerId, vi.fn(), undefined, mockDeps);

    expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(2);
    expect(mockDeps.createOrderAction).toHaveBeenLastCalledWith(expect.objectContaining({ clientRequestId: reqId, newCustomerData: mockOrder.newCustomerData }));
    expect(mockDeps.removePendingOrder).toHaveBeenCalledWith(reqId);
  });
});
