const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const regex = /const nextStatus = getNextState\(existingOrder\.status, action\);/;
const replacement = `const nextStatus = getNextState(existingOrder.status, action);

        // Bloquear confirmación o avance si faltan facturas
        if (action === 'VERIFY' || action === 'PACK' || action === 'DISPATCH') {
           const orderWithGroups = await tx.order.findUnique({ where: { id: orderId }, include: { groups: true } });
           if (orderWithGroups?.groups && orderWithGroups.groups.length > 0) {
              const allInvoiced = orderWithGroups.groups.every(g => g.externalInvoice);
              if (!allInvoiced) {
                 throw new Error('No se puede avanzar el pedido principal hasta que TODOS los grupos de material estén facturados.');
              }
           }
        }`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/app/actions/orders.ts', code);
console.log('Modified transitionOrder');
