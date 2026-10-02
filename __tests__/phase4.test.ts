import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSync } from '@/lib/useOfflineSync';

// Un simple Polyfill/Mock de navigator.locks para poder probar concurrencia de pestañas
class MockLockManager {
    locks = new Set<string>();
    async request(name: string, options: any, callback: (lock: any) => Promise<void>) {
        if (options.ifAvailable && this.locks.has(name)) {
            return callback(null); // No puede adquirir
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
        Object.defineProperty(global, 'navigator', { value: { onLine: true, locks: new MockLockManager() }, writable: true, configurable: true });
        
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

        // Hacemos que la acción demore para dar tiempo a simular concurrencia
        mockDeps.createOrderAction.mockImplementation(async () => {
            await new Promise(r => setTimeout(r, 50)); 
            return { success: true, order: { orderNumber: 'ORD-123' } };
        });

        // Lanzamos dos executeSync casi simultáneamente simulando 2 pestañas o clics repetidos
        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        const promise2 = executeSync('seller-1', refreshData, undefined, mockDeps);

        await Promise.all([promise1, promise2]);

        // Verificamos que SOLO LLEGÓ UNA LLAMADA al servidor
        expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(1);
        expect(mockOrders.length).toBe(0); // Se borró con éxito
    });

    it('2. Pérdida de respuesta tras crear el pedido (Conciliación Exitosa)', async () => {
        mockOrders.push({
            clientRequestId: 'perdida-1',
            status: 'failed_recoverable',
            items: [],
            createdAt: Date.now(),
            retryCount: 1, // Ya falló una vez
            nextRetryAt: 0  // Listo para reintentar
        });

        // Simulamos que la consulta de conciliación CONFIRMA que el pedido sí entró antes
        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-999' } });

        await executeSync('seller-1', refreshData, undefined, mockDeps);

        // Verificamos que SE CONSULTÓ pero NO se envió de nuevo
        expect(mockDeps.checkOrderByRequestId).toHaveBeenCalledWith('perdida-1');
        expect(mockDeps.createOrderAction).not.toHaveBeenCalled(); // <-- Evitó el duplicado
        expect(mockOrders.length).toBe(0); // Y lo quitó de la cola
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

        // El servidor siempre falla (simulando offline o 500)
        mockDeps.createOrderAction.mockRejectedValue(new Error("Network Error"));
        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: true }); // Servidor responde pero no tiene el pedido

        // Iteramos simulando el paso del tiempo 6 veces
        for(let i=0; i<6; i++) {
            // Forzar expiración del temporizador manipulando nextRetryAt
            mockOrders[0].nextRetryAt = 0;
            await executeSync('seller-1', refreshData, undefined, mockDeps);
        }

        // Debería detenerse en failed_intervention tras 5 intentos
        expect(mockOrders[0].status).toBe('failed_intervention');
        expect(mockOrders[0].retryCount).toBe(5);
        expect(mockOrders.length).toBe(1); // No lo descartó, lo retuvo para revisión
    });

    it('4. Cierre brusco durante Sincronizando', async () => {
        mockOrders.push({
            clientRequestId: 'crash-1',
            status: 'syncing', // Quedó colgado así de una sesión anterior
            items: [],
            createdAt: Date.now(),
            retryCount: 0,
            nextRetryAt: 0
        });

        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: true });
        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-200' } });

        // Cuando la app reabre y ejecuta executeSync
        await executeSync('seller-1', refreshData, undefined, mockDeps);

        // El sistema debió pasarlo a failed_recoverable y luego procesarlo (y fallar o ganar en el siguiente ciclo).
        // Sin embargo, nuestro processOrder lo baja a recoverable y en la MISMA iteración lo procesa si está online.
        expect(mockDeps.createOrderAction).toHaveBeenCalled();
        expect(mockOrders.length).toBe(0); // Lo procesó y limpió
    });

    it('5. Sesión expirada o cambio de vendedor', async () => {
        // useOfflineSync es el hook que detiene la sincronización si !authData.user
        // Por diseño en Phase 4, no mandamos la señal al coordinador si no hay user.
        // Aquí verificamos que el coordinador recibe los pendingOrders del vendedor específico.
        mockOrders.push({ clientRequestId: 'other-seller', sellerId: 'seller-2' });
        
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        
        // Si usamos 'seller-1', getPendingOrders usa 'seller-1'. 
        expect(mockDeps.getPendingOrders).toHaveBeenCalledWith('seller-1');
        // No se mezclan pedidos de distintos vendedores
    });
});
