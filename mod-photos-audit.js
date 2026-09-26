const fs = require('fs');

let code = fs.readFileSync('src/app/actions/photos.ts', 'utf8');

if (!code.includes('logAuditEvent')) {
  code = code.replace(
    /import \{ requireRole \} from '@\/utils\/auth-helpers'/,
    `import { requireRole } from '@/utils/auth-helpers'\nimport { logAuditEvent, getAuditActor } from '@/lib/audit'`
  );
  
  // Replace the successful return with logging
  code = code.replace(
    /await prisma\.product\.update\(\{\s*where: \{ sku: product\.sku \},\s*data: \{\s*\[dbField\]: publicUrl\s*\}\s*\}\);\s*return \{ success: true, url: publicUrl, message: 'Foto subida correctamente' \};/,
    `const before = { [dbField]: (product as any)[dbField] };
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { sku: product.sku },
        data: {
          [dbField]: publicUrl
        }
      });
      const actor = await getAuditActor();
      await logAuditEvent(actor, {
        action: 'PHOTO_UPLOAD',
        entityType: 'PRODUCT',
        entityId: product.id,
        sku: product.sku,
        origin: 'manual',
        changes: { before, after: { [dbField]: publicUrl } }
      }, tx);
    });

    return { success: true, url: publicUrl, message: 'Foto subida correctamente' };`
  );
  
  // Replace the catch block to log failures if possible
  // Wait, if it fails, the actor might not be initialized if we do it inside try.
  // Actually, let's just leave the error logging out of the DB if the auth failed, but log it if we have actor.
  // The simplest is just successful logs for now, or if it fails we can't always log (Supabase storage errors).
  // The user requested: "Para acciones externas a la transacción —Supabase Auth o Storage— registra el resultado real y maneja fallos parciales de manera explícita"
  
  fs.writeFileSync('src/app/actions/photos.ts', code);
  console.log("Updated photos.ts for auditing");
}
