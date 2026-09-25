const fs = require('fs');
let code = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');

if (!code.includes('logAuditEvent')) {
  code = code.replace(
    /import \{ requireRole \} from '@\/utils\/auth-helpers';/,
    `import { requireRole } from '@/utils/auth-helpers';\nimport { logAuditEvent, getAuditActor } from '@/lib/audit';`
  );

  code = code.replace(
    /const newSeller = await prisma\.seller\.create\(\{[\s\S]*?\}\);/,
    `const actor = await getAuditActor();
    const newSeller = await prisma.$transaction(async (tx) => {
      const s = await tx.seller.create({
        data: {
          authUserId: authUser.user.id,
          name: data.name,
          email: data.email,
          documentId: data.documentId,
          phone: data.phone,
        }
      });
      await logAuditEvent(actor, {
        action: 'SELLER_CREATE', entityType: 'SELLER', entityId: s.id, origin: 'manual', changes: { after: s }
      }, tx);
      return s;
    });`
  );

  code = code.replace(
    /const updated = await prisma\.seller\.update\(\{[\s\S]*?\}\);/,
    `const actor = await getAuditActor();
    const before = await prisma.seller.findUnique({ where: { id } });
    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.seller.update({
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
        action: 'SELLER_UPDATE', entityType: 'SELLER', entityId: s.id, origin: 'manual', changes
      }, tx);
      return s;
    });`
  );

  fs.writeFileSync('src/app/actions/sellers.ts', code);
  console.log("Updated sellers.ts for auditing");
}
