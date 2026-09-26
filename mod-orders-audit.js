const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

if (!code.includes('logAuditEvent')) {
  code = code.replace(
    /import \{ requireRole \} from '@\/utils\/auth-helpers';/,
    `import { requireRole } from '@/utils/auth-helpers';\nimport { logAuditEvent, getAuditActor } from '@/lib/audit';`
  );

  // transitionOrder
  code = code.replace(
    /const updatedOrder = await prisma\.order\.update\(\{[\s\S]*?\}\);/,
    `const actor = await getAuditActor();
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true, customer: true, seller: true }
      });
      await logAuditEvent(actor, {
        action: 'ORDER_TRANSITION',
        entityType: 'ORDER',
        entityId: o.id,
        orderNumber: o.orderNumber,
        origin: 'manual',
        changes: { before: { status: order.status }, after: { status: updateData.status } }
      }, tx);
      return o;
    });`
  );

  // updateOrderChecklist
  code = code.replace(
    /const updatedOrder = await tx\.order\.update\(\{[\s\S]*?\}\);/,
    `const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          items: {
            update: operations
          },
          adjustmentAcknowledged
        },
        include: { items: true, customer: true, seller: true }
      });
      
      const actor = await getAuditActor();
      await logAuditEvent(actor, {
        action: 'ORDER_ADJUSTMENT',
        entityType: 'ORDER',
        entityId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        origin: 'manual',
        changes: { items: operations } // storing the operations as changes
      }, tx);`
  );

  // updateMaterialGroupInvoice
  code = code.replace(
    /const res = await prisma\.materialGroup\.update\(\{[\s\S]*?\}\);/,
    `const actor = await getAuditActor();
    const group = await prisma.materialGroup.findUnique({ where: { id: groupId } });
    if (group) {
      const res = await prisma.$transaction(async (tx) => {
        const mg = await tx.materialGroup.update({
          where: { id: groupId },
          data: { externalInvoice: invoice },
          include: { order: true }
        });
        await logAuditEvent(actor, {
          action: 'ORDER_INVOICE',
          entityType: 'ORDER',
          entityId: mg.orderId,
          orderNumber: mg.order?.orderNumber,
          origin: 'manual',
          changes: { before: { externalInvoice: group.externalInvoice }, after: { externalInvoice: invoice } }
        }, tx);
        return mg;
      });
      return { success: true };
    }`
  );

  fs.writeFileSync('src/app/actions/orders.ts', code);
  console.log("Updated orders.ts for auditing");
}
