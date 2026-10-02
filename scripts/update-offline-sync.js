const fs = require('fs');
let content = fs.readFileSync('src/lib/useOfflineSync.ts', 'utf8');

const oldCode = `                if (res.code === 'BUSINESS_ERROR') {
                    await deps.updatePendingOrderStatus(order.clientRequestId, { 
                        status: 'failed_fatal', 
                        lastError: res.error || 'Rechazado por reglas de negocio.',
                        retryCount: newRetryCount,
                        nextRetryAt: nextRetry
                    });
                } else {`;

const newCode = `                if (res.code === 'CONFLICT_ERROR') {
                    await deps.updatePendingOrderStatus(order.clientRequestId, { 
                        status: 'conflict', 
                        lastError: res.error || 'Conflicto de inventario.',
                        conflicts: res.conflicts
                    });
                } else if (res.code === 'BUSINESS_ERROR') {
                    await deps.updatePendingOrderStatus(order.clientRequestId, { 
                        status: 'failed_fatal', 
                        lastError: res.error || 'Rechazado por reglas de negocio.',
                        retryCount: newRetryCount,
                        nextRetryAt: nextRetry
                    });
                } else {`;

content = content.replace(oldCode, newCode);

fs.writeFileSync('src/lib/useOfflineSync.ts', content);
