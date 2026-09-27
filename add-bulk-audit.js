const fs = require('fs');

let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

const errorLog = `
      const actor = await getAuditActor().catch(() => ({ id: 'unknown', name: 'Unknown', role: 'admin' as any }));
      await logAuditEvent(actor, {
        action: 'BULK_UPLOAD',
        entityType: 'PRODUCT',
        entityId: 'multiple',
        origin: 'admin_dashboard',
        result: 'error',
        changes: { error: error.message }
      });
      return { success: false, message: \`Ocurrió un error al guardar el inventario: \${error.message}\` };
`;

code = code.replace(
  /return \{ success: false, message: [\s\S]*?error\.message\}` \};/,
  errorLog.trim()
);

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log('Fixed error log in bulkUploadInventory');
