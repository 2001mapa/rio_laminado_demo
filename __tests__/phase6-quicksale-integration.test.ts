import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testDbUrl = process.env.TEST_DATABASE_URL;

// Validación de seguridad para evitar desastres
if (testDbUrl && !testDbUrl.includes('localhost') && !testDbUrl.includes('127.0.0.1')) {
  throw new Error('TEST_DATABASE_URL MUST point to a local database to prevent production data deletion.');
}

// Instanciar un PrismaClient exclusivo para la prueba (solo se usa si hay URL de prueba válida)
const testPrisma = testDbUrl ? new PrismaClient({ datasourceUrl: testDbUrl }) : (null as any);

// Inyectamos el prisma de prueba para que los actions usen la BD aislada
vi.mock('@/lib/prisma', () => ({
  default: testPrisma,
  prisma: testPrisma
}));

// Mock del auth para poder ejecutar createOrder
vi.mock('@/utils/auth-helpers', () => ({
  requireRole: vi.fn().mockResolvedValue({
    user: { id: 'test-123' },
    role: 'vendedor'
  })
}));

import { createOrder } from '@/app/actions/orders';

const shouldRun = testDbUrl ? describe : describe.skip;

shouldRun('Phase 6: Venta Rapida Integracion Real (PostgreSQL Aislado)', () => {
  let sellerId = '';
  let productId = '';

  const cleanupOrderIds: string[] = [];
  const cleanupCustomerIds: string[] = [];
  const cleanupMaterialGroups: string[] = [];

  beforeAll(async () => {
    const seller = await testPrisma.seller.create({ data: { name: 'Seller Test', email: `test-${Date.now()}@seller.com`, status: 'active', authUserId: 'test-123' } });
    sellerId = seller.id;

    const p = await testPrisma.product.create({ data: { sku: `TEST-SKU-${Date.now()}`, name: 'Anillo Test', category: 'Anillos', price: 100, physicalStock: 10 } });
    productId = p.id;
  });

  afterAll(async () => {
    // Limpiar estrictamente solo los IDs creados durante esta prueba
    if (cleanupOrderIds.length > 0) {
      await testPrisma.orderItem.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
      await testPrisma.orderMaterialGroup.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
      await testPrisma.order.deleteMany({ where: { id: { in: cleanupOrderIds } } });
    }
    
    if (cleanupCustomerIds.length > 0) {
      await testPrisma.customer.deleteMany({ where: { id: { in: cleanupCustomerIds } } });
    }

    if (productId) await testPrisma.product.deleteMany({ where: { id: productId } });
    if (sellerId) await testPrisma.seller.deleteMany({ where: { id: sellerId } });
    
    await testPrisma.$disconnect();
  });

  it('crea cliente y pedido atómicamente, y verifica rollback ante error de inventario', async () => {
    const reqId = uuidv4();
    
    // Intentamos crear con stock insuficiente para forzar un throw y probar rollback
    const resultPromise = createOrder({
      customerId: 'NEW_CUSTOMER',
      items: [{ productId, quantity: 9999, expectedPrice: 100 }], // Más que el physicalStock (10)
      clientRequestId: reqId,
      newCustomerData: { name: 'Cliente Rollback', phone: '111', city: 'BOG', address: 'Avenida 1' }
    });

    const result = await resultPromise;
    expect(result.success).toBe(false);
    expect(result.error).toContain('No hay stock');

    // Verificar el Rollback: No debe existir el pedido NI EL CLIENTE NUEVO.
    const orderCheck = await testPrisma.order.findUnique({ where: { clientRequestId: reqId } });
    expect(orderCheck).toBeNull();

    const customerCheck = await testPrisma.customer.findFirst({ where: { name: 'Cliente Rollback' } });
    expect(customerCheck).toBeNull();
  });

  it('maneja concurrencia y resuelve idempotencia (Carrera y Reintento)', async () => {
    const reqId = uuidv4();
    const orderData = {
      customerId: 'NEW_CUSTOMER',
      items: [{ productId, quantity: 1, expectedPrice: 100 }],
      clientRequestId: reqId,
      newCustomerData: { name: 'Cliente Idempotente', phone: '222', city: 'MED', address: 'Calle 2' }
    };

    // Carrera: dos peticiones concurrentes idénticas (simulando que el cliente clickeó dos veces o recargó rápido)
    const p1 = createOrder(orderData);
    const p2 = createOrder(orderData);

    const results = await Promise.allSettled([p1, p2]);
    
    // Al menos uno debe haber sido exitoso
    const successResult = results.find(r => r.status === 'fulfilled' && (r.value as any).success);
    expect(successResult).toBeDefined();

    const createdOrder = (successResult as PromiseFulfilledResult<any>).value.order;
    cleanupOrderIds.push(createdOrder.id);
    cleanupCustomerIds.push(createdOrder.customerId);

    // Reintento: una tercera petición idéntica tiempo después
    const result3 = await createOrder(orderData);
    expect(result3.success).toBe(true);
    expect(result3.order.id).toBe(createdOrder.id); // Debe devolver exactamente el mismo pedido

    // Verificación final en BD: Solo un cliente y un pedido creados
    const ordersByReq = await testPrisma.order.findMany({ where: { clientRequestId: reqId } });
    expect(ordersByReq.length).toBe(1);

    const customerInDb = await testPrisma.customer.findUnique({ where: { id: createdOrder.customerId } });
    expect(customerInDb).toBeDefined();
    expect(customerInDb!.internalSystemStatus).toBe('Pendiente');
    expect(customerInDb!.name).toBe('Cliente Idempotente');
  });
});
