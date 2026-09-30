const fs = require('fs');
let c = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

const hookBlockRegex = /  const \[offsetX, setOffsetX\] = useState<number>\(3\.2\);\n  const \[offsetY, setOffsetY\] = useState<number>\(1\.6\);\n  const \[gapY, setGapY\] = useState<number>\(3\.0\);\n  const \[gapX, setGapX\] = useState<number>\(3\.0\);\n/;

const match = c.match(hookBlockRegex);
if (!match) {
    console.error("Could not find offsetX hooks");
    process.exit(1);
}

c = c.replace(hookBlockRegex, '');

const injectTarget = "const [carrier, setCarrier] = useState('');\n  const [trackingNumber, setTrackingNumber] = useState('');\n";

c = c.replace(injectTarget, injectTarget + match[0]);

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', c);
console.log("Moved offsetX hooks up");
