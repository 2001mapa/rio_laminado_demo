const fs = require('fs');

let code = fs.readFileSync('src/app/actions/photos.ts', 'utf8');

const logCode = `
    const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: 'UPLOAD_PHOTO',
      entityType: 'PHOTO',
      entityId: product.id,
      sku: product.sku,
      origin: 'admin_dashboard',
      result: 'success',
      changes: {
        type: type === '1' ? 'Foto Principal' : 'Foto Hover',
        filename,
        publicUrl
      }
    });

    return { success: true, message: \`Foto de \${sku} guardada exitosamente.\` };
`;

code = code.replace(
  /return \{ success: true, message: `Foto de \$\{sku\} guardada exitosamente.` \};/,
  logCode
);

const logError = `
      const actor = await getAuditActor().catch(() => ({ id: 'unknown', name: 'Unknown', role: 'system' as any }));
      await logAuditEvent(actor, {
        action: 'UPLOAD_PHOTO',
        entityType: 'PHOTO',
        entityId: product.id,
        sku: product.sku,
        origin: 'admin_dashboard',
        result: 'error',
        changes: { error: error.message }
      });
      return { success: false, message: \`Error Storage: \${error.message}\` };
`;

code = code.replace(
  /return \{ success: false, message: `Error Storage: \$\{error\.message\}` \};/,
  logError
);

fs.writeFileSync('src/app/actions/photos.ts', code);
console.log('Added audit log to photos.ts');
