import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Procedimiento de Migración de Historial de Estados (Idempotente)
 *
 * Propósito: Mover registros antiguos de OrderStatusHistory a la tabla unificada AuditEvent
 * de manera que el historial de pedidos y las acciones administrativas estén en un solo flujo.
 *
 * - Idempotente: Verifica que el evento no exista ya en AuditEvent (por OrderID + Fecha).
 * - Identidad: Intenta resolver el nombre humano del actorAuthUserId desde Customer, Seller o Admin.
 *
 * Uso: npx ts-node scripts/migrate-history.ts
 */
async function migrateOrderStatusHistory() {
  console.log('Iniciando migración de OrderStatusHistory a AuditEvent...');
  
  const histories = await prisma.orderStatusHistory.findMany({
    include: { order: true }
  });

  console.log(`Se encontraron ${histories.length} registros históricos de transición.`);

  let migratedCount = 0;
  let duplicateCount = 0;

  for (const h of histories) {
    // Verificación de idempotencia
    const existing = await prisma.auditEvent.findFirst({
      where: {
        entityType: 'ORDER',
        entityId: h.orderId,
        action: 'STATUS_CHANGE',
        createdAt: h.createdAt
      }
    });

    if (existing) {
      duplicateCount++;
      continue;
    }

    // Resolución de identidad
    let actorName = 'ID Histórico (Desconocido)';
    if (h.actorAuthUserId) {
      // Intentar buscar en Seller
      const seller = await prisma.seller.findUnique({ where: { authUserId: h.actorAuthUserId } });
      if (seller) {
        actorName = seller.name;
      } else {
        // Intentar buscar en Customer
        const customer = await prisma.customer.findUnique({ where: { authUserId: h.actorAuthUserId } });
        if (customer) {
          actorName = customer.name;
        } else {
          // Si era admin u otro, dejemos su ID truncado como referencia si no hay nombre.
          actorName = `Admin/Eliminado (${h.actorAuthUserId.substring(0, 8)})`;
        }
      }
    } else {
      actorName = 'Sistema';
    }

    // Creación unificada
    await prisma.auditEvent.create({
      data: {
        createdAt: h.createdAt,
        actorId: h.actorAuthUserId || 'system',
        actorName: actorName,
        actorRole: h.actorRole || 'admin',
        action: 'STATUS_CHANGE',
        entityType: 'ORDER',
        entityId: h.orderId,
        orderNumber: h.order.orderNumber.toString(),
        origin: 'migration_script',
        changes: {
          previousStatus: h.previousStatus,
          nextStatus: h.nextStatus,
          action: h.action,
          reason: h.reason
        }
      }
    });
    migratedCount++;
  }

  console.log('=== Resumen de Migración ===');
  console.log(`Registros procesados: ${histories.length}`);
  console.log(`Migrados exitosamente: ${migratedCount}`);
  console.log(`Omitidos (ya existían): ${duplicateCount}`);
  console.log('============================');

  await prisma.$disconnect();
}

migrateOrderStatusHistory().catch(e => {
  console.error('Error crítico durante migración:', e);
  process.exit(1);
});
