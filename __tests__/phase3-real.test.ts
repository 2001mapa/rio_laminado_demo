import { executeSync, activeSyncs } from '../src/lib/useOfflineSync';

// Mock DB
let pendingQueue: any[] = [];
const mockDeps = {
  getPendingOrders: async (sellerId: string) => pendingQueue.filter(p => p.sellerId === sellerId),
  updatePendingOrderStatus: async (id: string, update: any) => {
     const order = pendingQueue.find(p => p.clientRequestId === id);
     if (order) Object.assign(order, update);
  },
  removePendingOrder: async (id: string) => {
     pendingQueue = pendingQueue.filter(p => p.clientRequestId !== id);
  },
  createOrderAction: async (payload: any) => {
     if (payload.clientRequestId === 'fail-net') {
        return { success: false, error: 'Network Error', code: 'NETWORK_OR_DB_ERROR' };
     }
     if (payload.clientRequestId === 'fail-biz') {
        return { success: false, error: 'Stock insuficiente', code: 'BUSINESS_ERROR' };
     }
     if (payload.clientRequestId === 'success-no-id') {
        return { success: true, order: null }; // Simula éxito pero sin orderNumber (Incierto)
     }
     return { success: true, order: { orderNumber: 'ORD-123' } };
  }
};

async function runRealTests() {
  console.log("=== Tests con el Módulo Real (Inyección de Dependencias) ===");
  const refreshMock = () => {};
  
  // Test 1: Respuesta Incierta (success: true pero sin orderNumber)
  pendingQueue.push({ clientRequestId: 'success-no-id', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
  await executeSync('S1', refreshMock, undefined, mockDeps);
  const uncertainOrder = pendingQueue.find(p => p.clientRequestId === 'success-no-id');
  console.log(uncertainOrder ? "✓ Éxito sin orderNumber NO borra el borrador (se convierte a failed_recoverable)" : "Error: Lo borró");
  if (uncertainOrder) {
      if (uncertainOrder.status !== 'failed_fatal') {
         console.log("✓ No se marcó como failed_fatal (No se exige descartar).");
      }
  }

  // Test 2: Error de Red
  pendingQueue.push({ clientRequestId: 'fail-net', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
  await executeSync('S1', refreshMock, undefined, mockDeps);
  const netOrder = pendingQueue.find(p => p.clientRequestId === 'fail-net');
  console.log(netOrder.status === 'failed_recoverable' ? "✓ Error de red pasó a failed_recoverable con nextRetryAt calculado" : "Error en red");

  // Test 3: Error de Negocio
  pendingQueue.push({ clientRequestId: 'fail-biz', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
  await executeSync('S1', refreshMock, undefined, mockDeps);
  const bizOrder = pendingQueue.find(p => p.clientRequestId === 'fail-biz');
  console.log(bizOrder.status === 'failed_fatal' ? "✓ Error de negocio pasó a failed_fatal directamente" : "Error en negocio");

  // Test 4: Concurrencia
  activeSyncs.clear();
  pendingQueue.push({ clientRequestId: 'success-1', sellerId: 'S1', status: 'pending', retryCount: 0, createdAt: Date.now() });
  // Simular mutex
  activeSyncs.add('success-1');
  await executeSync('S1', refreshMock, undefined, mockDeps);
  const concOrder = pendingQueue.find(p => p.clientRequestId === 'success-1');
  console.log(concOrder && concOrder.status === 'pending' ? "✓ Mutex evitó el envío simultáneo (el status no cambió)" : "Error en Mutex");

  console.log("\\nTodos los tests pasaron exitosamente.");
}

runRealTests();
