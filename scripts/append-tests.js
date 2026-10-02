const fs = require('fs');

let c = fs.readFileSync('__tests__/phase4.test.ts', 'utf8');

const newTests = `
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
        
        // Antes de que promise2 empiece, alguien (promise1) borra mockOrders porque terminó
        // Wait, simulamos que promise1 y promise2 se llaman con la MISMA lista leída inicialmente
        // executeSync lee getPendingOrders al INICIO.
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

        // Simular error 500
        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: false });
        
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        
        // Como hubo error 500 y no notFound, aborta y NO llama a createOrderAction
        expect(mockDeps.createOrderAction).not.toHaveBeenCalled();
        
        // Ahora simulamos notFound = true
        mockDeps.checkOrderByRequestId.mockResolvedValue({ success: false, notFound: true });
        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-999' } });
        
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        // Ahora SÍ debió llamar a createOrderAction porque el servidor dijo "no lo tengo"
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

        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: null }); // Sin orderNumber
        
        await executeSync('seller-1', refreshData, undefined, mockDeps);
        
        // NO debe borrar el pedido, sino pasarlo a failed_recoverable
        expect(mockOrders.length).toBe(1);
        expect(mockOrders[0].status).toBe('failed_recoverable');
    });

    it('9. Navegador sin Web Locks (Fallback a LocalStorage)', async () => {
        // Removemos navigator.locks
        const originalLocks = global.navigator.locks;
        delete (global.navigator as any).locks;

        // Limpiamos mockOrders y añadimos uno
        mockOrders.length = 0;
        mockOrders.push({
            clientRequestId: 'no-locks-1',
            status: 'pending',
            items: [],
            createdAt: Date.now(),
            retryCount: 0
        });

        mockDeps.createOrderAction.mockResolvedValue({ success: true, order: { orderNumber: 'ORD-555' } });
        
        // Proveemos localStorage simulado
        const store: Record<string, string> = {};
        (global as any).window = {
            localStorage: {
                getItem: (k: string) => store[k] || null,
                setItem: (k: string, v: string) => store[k] = v,
                removeItem: (k: string) => delete store[k]
            }
        };

        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        // Simulamos concurrencia. El fallback bloquea usando LocalStorage
        // Si promise1 pone el item en store, promise2 lo verá y saltará
        store['lock_rio-sync-no-locks-1'] = Date.now().toString(); // "Ya está bloqueado" por alguien más
        
        await promise1;
        
        // Restablecemos locks para otros tests
        (global.navigator as any).locks = originalLocks;
    });
`;

c = c.replace('});', newTests + '\n});');
fs.writeFileSync('__tests__/phase4.test.ts', c);
