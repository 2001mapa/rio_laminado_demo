const fs = require('fs');
let c = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

const start = c.indexOf('const [offsetX');
const end = c.indexOf('return (', start);

const chunk = c.substring(start, end);
c = c.substring(0, start) + c.substring(end);

const injectTarget = "const [trackingNumber, setTrackingNumber] = useState('');\n";
c = c.replace(injectTarget, injectTarget + "  " + chunk);

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', c);
console.log("Moved hooks");
