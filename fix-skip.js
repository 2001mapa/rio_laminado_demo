const fs = require('fs');
let code = fs.readFileSync('src/app/actions/photos.ts', 'utf8');

code = code.replace(
  "const file = formData.get('file') as File;",
  "const skipAudit = formData.get('skipAudit') === 'true';\n    const file = formData.get('file') as File;"
);

const logBlock = `const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: 'UPLOAD_PHOTO',
      entityType: 'PHOTO',
      entityId: product.id,
      sku: product.sku,
      origin: 'admin_dashboard',
    });`;

const newLogBlock = `if (!skipAudit) {
      const actor = await getAuditActor();
      await logAuditEvent(actor, {
        action: 'UPLOAD_PHOTO',
        entityType: 'PHOTO',
        entityId: product.id,
        sku: product.sku,
        origin: 'admin_dashboard',
      });
    }`;

code = code.split(logBlock).join(newLogBlock);

fs.writeFileSync('src/app/actions/photos.ts', code);
console.log('Fixed photos');
