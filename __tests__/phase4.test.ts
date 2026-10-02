import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSync } from '@/lib/useOfflineSync';

class MockLockManager {
    locks = new Set<string>();
    async request(name: string, options: any, callback: (lock: any) => Promise<void>) {
        if (options.ifAvailable && this.locks.has(name)) {
            return callback(null);
        }
        this.locks.add(name);
        try {
            await callback({ name });
        } finally {
            this.locks.delete(name);
        }
    }
}

describe('Fase 4: Sincronización Avanzada (Coordinador)', () => {
    let mockDeps: any;
    let mockOrders: any[];
    let refreshData = vi.fn();
    
    beforeEach(() => {
        Object.defineProperty(global, 'navigator', {
            value: { onLine: true, locks: new MockLockManager() },
            writable: true,
            configurable: true
        });
        
        mockOrders = [];
        mockDeps = {
            getPendingOrders: vi.fn(async () => mockOrders),
            updatePendingOrderStatus: vi.fn(async (id, data) => {
                const o = mockOrders.find(x => x.clientRequestId === id);
                if (o) Object.assign(o, data);
            }),
            removePendingOrder: vi.fn(async (id) => {
                mockOrders = mockOrders.filter(x => x.clientRequestId !== id);
            }),
            createOrderAction: vi.fn(),
            checkOrderByRequestId: vi.fn()
        };
        refreshData.mockClear();
    });

    it('1. Reintento manual y automático simultáneos (Doble Clic / Dos Pestañas)', async () => {
        mockOrders.push({
            clientRequestId: 'doble-1',
            status: 'pending',
            items: [],
            createdAt: Date.now(),
            retryCount: 0
        });

        mockDeps.createOrderAction.mockImplementation(async () => {
            await new Promise(r => setTimeout(r, 50)); 
            return { success: true, order: { orderNumber: 'ORD-123' } };
        });

        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        const promise2 = executeSync('seller-1', refreshData, undefined, mockDeps);

        await Promise.all([promise1, promise2]);
        expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(1);
        expect(mockOrders.length).toBe(0);
    });

    it('2. Pérdida de respuesta tras crear el pedido (Conciliación Exitosa)', async () => {
        mockOrders.push({
            clientRequestId: 'perdida-1',
            status: 'failed_recoverable',
            items: [],
            createdAt: Date.now(),
            retryCount: 1,
            nextRetryAt: 0
        });

        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-999' } });
        await executeSync('seller-1', refreshData, undefined, mockDeps);

        expect(mockDeps.checkOrderByRequestId).toHaveBeenCalledWith('perdida-1');
        expect(mockDeps.createOrderAction).not.toHaveBeenCalled();
        expect(mockOrders.length).toBe(0);
    });

    it('3. Cinco fallos de red (Backoff y Fallo de Intervención)', async () => {
        mockOrders.push({
            clientRequestId: 'net-fallo-1',
            status: 'pending',
            items: [],
            createdAt: Date.now(),
            retryCount: 0,
            nextRetryAt: 0
        });

        mockDeps.createOrderAction.mockRejectedValue(new Error("Network Error"));
        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: true });

        for(let i=0; i<6; i++) {
            mockOrders[0].nextRetryAt = 0;
            await executeSync('seller-1', refreshData, undefined, mockDeps);
        }

        expect(mockOrders[0].status).toBe('failed_intervention');
        expect(mockOrders[0].retryCount).toBe(5);
        expect(mockOrders.length).toBe(1);
    });

    it('4. Cierre brusco durante Sincronizando', async () => {
        mockOrders.push({
            clientRequestId: 'crash-1',
            status: 'syncing',
            items: [],
            createdAt: Date.now(),
            retryCount: 0,
            nextRetryAt: 0
        });

        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: true });
        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-200' } });

        await executeSync('seller-1', refreshData, undefined, mockDeps);
        expect(mockDeps.createOrderAction).toHaveBeenCalled();
        expect(mockOrders.length).toBe(0);
    });

    it('5. Sesión expirada o cambio de vendedor', async () => {
        mockOrders.push({ clientRequestId: 'other-seller', sellerId: 'seller-2' });
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        expect(mockDeps.getPendingOrders).toHaveBeenCalledWith('seller-1');
    });

    it('6. Dos pestañas con lectura obsoleta (Stale Read)', async () => {
        mockOrders.push({
            clientRequestId: 'stale-1',
            status: 'pending',
            items: [],
            createdAt: Date.now(),
            retryCount: 0
        });

        mockDeps.createOrderAction.mockImplementation(async () => {
            await new Promise(r => setTimeout(r, 50)); 
            return { success: true, order: { orderNumber: 'ORD-123' } };
        });

        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        const promise2 = executeSync('seller-1', refreshData, undefined, mockDeps);

        await Promise.all([promise1, promise2]);
        expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(1);
    });

    it('7. Error de la consulta de conciliación (Distinguir notFound)', async () => {
        mockOrders.push({
            clientRequestId: 'conc-err',
            status: 'failed_recoverable',
            items: [],
            createdAt: Date.now(),
            retryCount: 1,
            nextRetryAt: 0
        });

        // Error sin notFound
        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: false });
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        expect(mockDeps.createOrderAction).not.toHaveBeenCalled();
        
        // notFound = true
        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: true });
        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-999' } });
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(1);
        expect(mockOrders.length).toBe(0);
    });

    it('8. Respuesta exitosa sin orderNumber (No debe borrar)', async () => {
        mockOrders.push({
            clientRequestId: 'no-order-num',
            status: 'pending',
            items: [],
            createdAt: Date.now(),
            retryCount: 0
        });

        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: null }); 
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        expect(mockOrders.length).toBe(1);
        expect(mockOrders[0].status).toBe('failed_recoverable');
    });

    it('9. Navegador sin Web Locks (Fallback a LocalStorage)', async () => {
        const originalLocks = global.navigator.locks;
        delete (global.navigator as any).locks;

        mockOrders.length = 0;
        mockOrders.push({
            clientRequestId: 'no-locks-1',
            status: 'pending',
            items: [],
            createdAt: Date.now(),
            retryCount: 0
        });

        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-555' } });
        
        const store: Record<string, string> = {};
        (global as any).window = {
            localStorage: {
                getItem: (k: string) => store[k] || null,
                setItem: (k: string, v: string) => store[k] = v,
                removeItem: (k: string) => delete store[k]
            }
        };

        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        store['lock_rio-sync-no-locks-1'] = Date.now().toString(); 
        await promise1;
        
        (global.navigator as any).locks = originalLocks;
    });
});
