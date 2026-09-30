const fs = require('fs');
let c = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');

const replacement1 = `    }

    const actor = await getAuditActor();
    await logAuditEvent(actor, {
      action: 'UPDATE_SELLER',
      entityType: 'SELLER',
      entityId: id,
      changes: {
        before: { name: existingSeller.name, email: existingSeller.email, status: existingSeller.status },
        after: { name: seller.name, email: seller.email, status: seller.status }
      }
    });

    return { 
      success: true, 
      message: 'Vendedor actualizado exitosamente.',
      seller: seller 
    };`;

c = c.replace(/    \}\r?\n\r?\n    return \{ \r?\n      success: true, \r?\n      message: 'Vendedor actualizado exitosamente\.',\r?\n      seller: seller \r?\n    \};/, replacement1);

fs.writeFileSync('src/app/actions/sellers.ts', c);
console.log('Fixed sellers.ts');
