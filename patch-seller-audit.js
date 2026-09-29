const fs = require('fs');

let code = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');

if (!code.includes("import { logAuditEvent, getAuditActor }")) {
    code = code.replace("import { requireRole } from '@/utils/auth-helpers';", "import { requireRole } from '@/utils/auth-helpers';\nimport { logAuditEvent, getAuditActor } from '@/lib/audit';");
}

const createSuccess = "success: true, \n        seller,";
const replaceCreateSuccess = `success: true, \n        seller,\n        // AUDIT\n        ...(await (async () => {\n          const actor = await getAuditActor();\n          await logAuditEvent(actor, { action: 'CREATE_SELLER', entityType: 'SELLER', entityId: seller.id, changes: { email: seller.email, name: seller.name } }); return {};\n        })()),`;

// I will just use a more surgical replace.
// Let's rewrite updateSeller manually in the script.
code = code.replace(/export async function updateSeller[\s\S]*?return { success: true, seller };\n  \} catch \(error: any\) \{/m, (match) => {
    let replaced = match.replace(
        "return { success: true, seller };",
        `const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: data.status === 'active' ? (existingSeller.status !== 'active' ? 'RESTORE_SELLER' : 'UPDATE_SELLER') : 'SUSPEND_SELLER',
      entityType: 'SELLER',
      entityId: id,
      changes: { oldStatus: existingSeller.status, newStatus: data.status }
    });
    return { success: true, seller };`
    );
    return replaced;
});

code = code.replace(/export async function createSeller[\s\S]*?return \{ \n        success: true, \n        seller,\n        tempPassword\n      \};/m, (match) => {
    return match.replace(
        "return { \n        success: true, \n        seller,\n        tempPassword\n      };",
        `const actor = await getAuditActor();
      await logAuditEvent(actor, { action: 'CREATE_SELLER', entityType: 'SELLER', entityId: seller.id, changes: { email: seller.email } });
      return { 
        success: true, 
        seller,
        tempPassword
      };`
    );
});

fs.writeFileSync('src/app/actions/sellers.ts', code);
console.log('Auditing added to sellers');
