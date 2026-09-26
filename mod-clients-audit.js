const fs = require('fs');

let code = fs.readFileSync('src/app/actions/clients.ts', 'utf8');

if (!code.includes('logAuditEvent')) {
  code = code.replace(
    /import \{ requireRole \} from '@\/utils\/auth-helpers';/,
    `import { requireRole } from '@/utils/auth-helpers';\nimport { logAuditEvent, getAuditActor } from '@/lib/audit';`
  );

  // updateCustomerStatusAction
  code = code.replace(
    /const client = await prisma\.customer\.update\(\{[\s\S]*?\}\);/,
    `const actor = await getAuditActor();
    const before = await prisma.customer.findUnique({ where: { id } });
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.customer.update({
        where: { id },
        data: { isActive: data.isActive }
      });
      await logAuditEvent(actor, {
        action: 'CUSTOMER_STATUS', entityType: 'CUSTOMER', entityId: c.id, origin: 'manual',
        changes: { before: { isActive: before?.isActive }, after: { isActive: data.isActive } }
      }, tx);
      return c;
    });`
  );

  // updateCustomerDataAction
  code = code.replace(
    /const client = await prisma\.customer\.update\(\{[\s\S]*?\}\);/,
    `const actor = await getAuditActor();
    const before = await prisma.customer.findUnique({ where: { id } });
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.customer.update({
        where: { id },
        data
      });
      const changes: any = {};
      for (const key in data) {
         if ((before as any)[key] !== (data as any)[key]) {
            changes[key] = { before: (before as any)[key], after: (data as any)[key] };
         }
      }
      await logAuditEvent(actor, {
        action: 'CUSTOMER_UPDATE', entityType: 'CUSTOMER', entityId: c.id, origin: 'manual', changes
      }, tx);
      return c;
    });`
  );

  // resetCustomerPasswordAction
  // Note: this interacts with supabase.auth.admin.updateUserById, so we log after it succeeds
  code = code.replace(
    /return \{ success: true \};(\s*)\} catch \(error: any\)/,
    `const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: 'CUSTOMER_PASSWORD_RESET', entityType: 'CUSTOMER', entityId: customerId, origin: 'manual', changes: { redacted: true }
    });
    return { success: true };
  } catch (error: any)`
  );

  // createCustomer -> logs after prisma creation
  // wait, createCustomer is complex, it does supabase.auth.admin.createUser then prisma.customer.create
  code = code.replace(
    /const newClient = await prisma\.customer\.create\(\{[\s\S]*?\}\);/,
    `const actor = await getAuditActor();
    const newClient = await prisma.$transaction(async (tx) => {
      const c = await tx.customer.create({
        data: {
          authUserId: authUser.user.id,
          name: data.name,
          email: data.email,
          documentId: data.documentId,
          documentType: data.documentType,
          phone: data.phone,
          commercialName: data.commercialName,
          shippingAddress: data.shippingAddress,
          city: data.city,
          department: data.department,
          sellerId: data.sellerId,
        }
      });
      await logAuditEvent(actor, {
        action: 'CUSTOMER_CREATE', entityType: 'CUSTOMER', entityId: c.id, origin: 'manual', changes: { after: c }
      }, tx);
      return c;
    });`
  );

  fs.writeFileSync('src/app/actions/clients.ts', code);
  console.log("Updated clients.ts for auditing");
}
