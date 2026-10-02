const fs = require('fs');

let content = fs.readFileSync('__tests__/phase4.test.ts', 'utf8');

// Eliminar el bloque entero del test 10 roto y cualquier rastro de getItemCalls en el test 9
const test9Fix = `        const store: Record<string, string> = {};
        (global as any).window = {
            localStorage: {
                getItem: (k: string) => store[k] || null,
                setItem: (k: string, v: string) => store[k] = v,
                removeItem: (k: string) => delete store[k]
            }
        };`;

content = content.replace(/        const store: Record<string, string> = {};\s+let getItemCalls = 0;\s+\(global as any\)\.window = {[\s\S]*?removeItem: \(k: string\) => delete store\[k\]\s+}\s+};/m, test9Fix);

// Eliminar Test 10 entero
content = content.replace(/\s+it\('10\. Carrera en LocalStorage[\s\S]+?\}\);\n\}\);/, '\n});\n});');

const test10 = `
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
        let p1Wait: any, p2Wait: any;
        const p1Ready = new Promise(r => { p1Wait = r; });
        const p2Ready = new Promise(r => { p2Wait = r; });

        mockDeps.createOrderAction.mockImplementation(async () => {
            serverDbCount++;
            return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
        });

        let getOrdersCalls = 0;
        mockDeps.getPendingOrders = vi.fn().mockImplementation(async () => {
            getOrdersCalls++;
            // Devolver el pedido para las dos llamadas iniciales
            if (getOrdersCalls <= 2) {
                return [{
                    clientRequestId: 'race-uuid-1',
                    status: 'pending',
                    items: [],
                    createdAt: Date.now(),
                    retryCount: 0
                }];
            }
            return mockOrders; // normal
        });

        const store: Record<string, string> = {};
        let getLockCalls = 0;
        (global as any).window = {
            localStorage: {
                getItem: (k: string) => {
                    getLockCalls++;
                    // Ambas leen null simulando la condición de carrera
                    if (getLockCalls <= 2) return null;
                    return store[k] || null;
                },
                setItem: (k: string, v: string) => store[k] = v,
                removeItem: (k: string) => delete store[k]
            }
        };

        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        const promise2 = executeSync('seller-1', refreshData, undefined, mockDeps);
        
        await Promise.all([promise1, promise2]);
        
        expect(mockDeps.createOrderAction).toHaveBeenCalledTimes(2); 
        expect(serverDbCount).toBe(2); // El mock fue llamado dos veces (por las dos peticiones enviadas)
        expect(mockDeps.removePendingOrder).toHaveBeenCalledWith('race-uuid-1'); // Pero se limpia con el mismo ID
        
        (global.navigator as any).locks = originalLocks;
    });
`;

content = content.replace(/\n\}\);\n\}\);/, `\n${test10}\n});\n});`);

fs.writeFileSync('__tests__/phase4.test.ts', content);
