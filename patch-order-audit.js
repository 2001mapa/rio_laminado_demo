const fs = require('fs');

let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

// Add import
if (!code.includes('logAuditEvent')) {
  code = code.replace(
    "import { requireRole } from '@/utils/auth-helpers'",
    "import { requireRole } from '@/utils/auth-helpers'\nimport { logAuditEvent, getAuditActor } from '@/lib/audit'"
  );
}

// Find transitionOrder start
const searchStart = "export async function transitionOrder";
const searchTxStart = "const order = await prisma.$transaction(async (tx) => {";

// Inside the transaction, let's get the actor (or before the transaction)
// Actually getting actor before transaction is better to avoid await inside tx if it queries DB (which it does, for name).
code = code.replace(
  "const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);\n  \n  try {\n    const order = await prisma.$transaction(async (tx) => {",
  "const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);\n  const actor = await getAuditActor();\n  \n  try {\n    const order = await prisma.$transaction(async (tx) => {"
);

// Add the logAuditEvent after the orderStatusHistory.create
const targetLog = `await tx.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: existingOrder.status,
          nextStatus,
          action,
          actorAuthUserId: user.id,
          actorRole: role,
          reason
        }
      });`;

const replaceLog = `await tx.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: existingOrder.status,
          nextStatus,
          action,
          actorAuthUserId: user.id,
          actorRole: role,
          reason
        }
      });
      
      await logAuditEvent(actor, {
        action: 'ORDER_TRANSITION',
        entityType: 'ORDER',
        entityId: orderId,
        orderNumber: existingOrder.orderNumber,
        origin: 'transition_order',
        changes: { previousStatus: existingOrder.status, nextStatus, action, reason }
      }, tx);`;

code = code.replace(targetLog, replaceLog);
fs.writeFileSync('src/app/actions/orders.ts', code);
console.log('Added order audit logging');
