const fs = require('fs');

let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

const successLog = `
    await prisma.$transaction(operations);

    try {
      const actor = await getAuditActor();
      await logAuditEvent(actor, {
        action: 'BULK_UPLOAD',
        entityType: 'PRODUCT',
        entityId: 'multiple',
        origin: 'admin_dashboard',
        result: 'success',
        changes: {
          totalProcessed: items.length,
          newProducts: newItems.length,
          updatedProducts: items.length - newItems.length,
          warnings: warnings.length
        }
      });
    } catch (auditErr) {
      console.error('Failed to log audit for bulk upload:', auditErr);
    }
`;

if (!code.includes("action: 'BULK_UPLOAD',\n        entityType: 'PRODUCT',")) {
  code = code.replace(
    /await prisma\.\$transaction\(operations\);/,
    successLog
  );
  fs.writeFileSync('src/app/actions/inventory.ts', code);
  console.log('Added success audit log to bulkUploadInventory');
} else {
  console.log('Success audit log already seems present or regex mismatch. Replacing anyway.');
  code = code.replace(
    /await prisma\.\$transaction\(operations\);[\s\S]*?return \{/m,
    successLog + '\n      return {'
  );
  fs.writeFileSync('src/app/actions/inventory.ts', code);
}
