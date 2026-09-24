const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

const targetToReplace = `
            if (order.groups && order.groups.length > 0 && !printingSingle) {
               order.groups.forEach(g => {
                  const gItems = itemsToPrint.filter(i => i.materialGroupId === g.id);
                  gItems.forEach((item, index) => {
                     const product = products.find(p => p.id === item.productId);
                     elements.push({ type: 'item', item, index, product });
                  });
                  elements.push({ type: 'marker', text: \`Fin de \${g.material}\` });
               });
            } else {
`;

const replacement = `
            if (order.groups && order.groups.length > 0 && !printingSingle) {
               order.groups.forEach(g => {
                  const gItems = itemsToPrint.filter(i => i.materialGroupId === g.id);
                  gItems.forEach((item, index) => {
                     const product = products.find(p => p.id === item.productId);
                     elements.push({ type: 'item', item, index, product });
                  });
               });
            } else {
`;

if (code.includes('elements.push({ type: \'marker\'')) {
  // Let's just use regex to remove the marker line.
  code = code.replace(/elements\.push\(\{\s*type:\s*'marker',\s*text: [^}]+ \}\);\s*/g, '');
  fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', code);
  console.log('Removed marker logic');
} else {
  console.log('Marker logic not found or already removed');
}
