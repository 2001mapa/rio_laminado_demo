const fs = require('fs');

let content = fs.readFileSync('__tests__/phase4.test.ts', 'utf8');
content = content.replace(
`        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps);
        const promise2 = executeSync('seller-1', refreshData, undefined, mockDeps);`,
`        const promise1 = executeSync('seller-1', refreshData, undefined, mockDeps).then(() => console.log("P1 Done"));
        const promise2 = executeSync('seller-1', refreshData, undefined, mockDeps).then(() => console.log("P2 Done"));`
);

content = content.replace(
`        mockDeps.createOrderAction.mockImplementation(async (data: any) => {
            await serverDelay; 
            // Esto asegura que ambas peticiones estén "en vuelo" simultáneamente
            if (serverDbCount === 0) {
               serverDbCount++;
               return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
            } else {
               // Ya existe! Idempotencia
               return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
            }
        });`,
`        mockDeps.createOrderAction.mockImplementation(async (data: any) => {
            console.log("createOrderAction called!", serverDbCount);
            await serverDelay; 
            // Esto asegura que ambas peticiones estén "en vuelo" simultáneamente
            if (serverDbCount === 0) {
               serverDbCount++;
               return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
            } else {
               // Ya existe! Idempotencia
               return { success: true, order: { orderNumber: 'ORD-IDEMPOTENT' } };
            }
        });`
);

fs.writeFileSync('__tests__/phase4.test.ts', content);
