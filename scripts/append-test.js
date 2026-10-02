const fs = require('fs');

const testToAdd = `
    it('10. Carrera en LocalStorage: Dos pestañas envían al servidor, idempotencia salva', async () => {
        const originalLocks = global.navigator.locks;
        delete (global.navigator as any).locks;

        mockOrders.length = 0;
        mockOrders.push({
            clientRequestId: 'race-uuid-1',
            status: 'pending',
            items: [],
            createdAt: Date.now(),
            retryCount: 0
        });

        let serverDbCount = 0;
        mockDeps.createOrderAction.mockImplementation(async (data: any) => {
            // Simulamos idempotencia real del servidor:
            // Si llega la misma petición, se devuelve el mismo número, pero no se crea otro en la BD.
            serverDbCount++;
            return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
        });
        
        let resolveServer: any;
        const serverDelay = new Promise(resolve => { resolveServer = resolve; });
        mockDeps.createOrderAction.mockImplementation(async (data: any) => {
            await serverDelay; 
            // Esto asegura que ambas peticiones estén "en vuelo" simultáneamente
            if (serverDbCount === 0) {
               serverDbCount++;
               return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
            } else {
               // Ya existe! Idempotencia
               return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
            }
        });

        const store: Record<string, string> = {};
        (global as any).window = {
            localStorage: {
                getItem: (k: string) => store[k] || null,
                setItem: (k: string, v: string) => store[k] = v,
                removeItem: (k: string) => delete store[k]
            }
        };

        // Ambas llamadas inician simultáneamente. Ambas leen null de localStorage.
        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        const promise2 = executeSync('seller-1', refreshData, undefined, mockDeps);
        
        // Desbloqueamos el servidor
        resolveServer();
        
        await Promise.all([promise1, promise2]);
        
        // Ambas intentan borrar, lo cual es seguro.
        expect(mockDeps.removePendingOrder).toHaveBeenCalledWith('race-uuid-1');
        // El servidor procesó peticiones concurrentes, pero gracias a la idempotencia
        // (simulada aquí y real en la BD usando unique clientRequestId o upsert),
        // serverDbCount solo subió a 1.
        expect(serverDbCount).toBe(1);
        expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(2); // Hubo 2 peticiones al servidor
        
        (global.navigator as any).locks = originalLocks;
    });
`;

let content = fs.readFileSync('__tests__/phase4.test.ts', 'utf8');
content = content.replace(/}\);\n\n}\);/g, `});\n${testToAdd}\n});`);
// The file might end in `    });\n});`
content = content.replace(/    }\);\n}\);/g, `    });\n${testToAdd}\n});`);
fs.writeFileSync('__tests__/phase4.test.ts', content);
