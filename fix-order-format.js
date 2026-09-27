const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const replacement = `
        const totalAmount = subtotal * (1 - discount);
        
        const prefix = finalSellerId ? 'VEN' : 'WEB';
        const lastOrder = await tx.order.findFirst({
          where: { orderNumber: { startsWith: \`\${prefix}-\` } },
          orderBy: { createdAt: 'desc' }
        });
        
        let nextNumber = 1;
        if (lastOrder) {
          const parts = lastOrder.orderNumber.split('-');
          if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) nextNumber = num + 1;
          }
        }
        
        const orderNumber = \`\${prefix}-\${nextNumber.toString().padStart(4, '0')}\`;

        const newOrder = await tx.order.create({
`;

code = code.replace(
  /const totalAmount = subtotal \* \(1 \- discount\);\s*const orderNumber = `PED-\$\{Math\.floor\(1000 \+ Math\.random\(\) \* 9000\)\}-\$\{Date\.now\(\)\.toString\(\)\.slice\(-4\)\}`;[\s\S]*?const newOrder = await tx\.order\.create\(\{/g,
  replacement.trim() + ' {'
);

fs.writeFileSync('src/app/actions/orders.ts', code);
console.log('Fixed order number generation format');
