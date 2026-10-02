const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(
`    if (currentCheckoutId && pendingQueue.some(o => o.clientRequestId === currentCheckoutId)) {`,
`    console.log('CHECKOUT CLICK:', { currentCheckoutId, pendingQueueIds: pendingQueue.map(o => o.clientRequestId) });
    if (currentCheckoutId && pendingQueue.some(o => o.clientRequestId === currentCheckoutId)) {`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
