const fs = require('fs');
let code = fs.readFileSync('src/app/actions/photos.ts', 'utf8');

// 1. Modify uploadProductPhoto to accept skipAudit and not log if true
const targetA = `      const file = formData.get('file') as File;`;
const replaceA = `      const skipAudit = formData.get('skipAudit') === 'true';\n      const file = formData.get('file') as File;`;
code = code.replace(targetA, replaceA);

const targetB = `      const actor = await getAuditActor();
      await logAuditEvent(actor, {
        action: 'UPLOAD_PHOTO',
        entityType: 'PHOTO',
        entityId: product.id,
        sku: product.sku,
        origin: 'admin_dashboard',
      });`;

const replaceB = `      if (!skipAudit) {
        const actor = await getAuditActor();
        await logAuditEvent(actor, {
          action: 'UPLOAD_PHOTO',
          entityType: 'PHOTO',
          entityId: product.id,
          sku: product.sku,
          origin: 'admin_dashboard',
        });
      }`;

// We need to replace it in two places (if it exists twice) or just replace all instances globally.
// Looking at my previous cat, it might be there twice (one for success, one for error? No, one for replacing existing).
// Let's replace globally.
code = code.split(targetB).join(replaceB);

// 2. Add logBulkPhotoUpload
const newAction = `
export async function logBulkPhotoUpload(count: number) {
  try {
    await requireRole(['admin']);
    const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: 'BULK_PHOTO_UPLOAD',
      entityType: 'PRODUCT',
      entityId: 'multiple',
      sku: 'multiple',
      origin: 'admin_dashboard',
      changes: { message: \`Se subieron \${count} fotos de forma masiva.\` }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error logging bulk upload:', error);
    return { success: false };
  }
}
`;

code += newAction;

fs.writeFileSync('src/app/actions/photos.ts', code);
console.log('Fixed photos.ts');
