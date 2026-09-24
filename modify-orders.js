const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const replacement = `const order = await prisma.$transaction(async (tx) => {
        let subtotal = 0;
        const orderItemsByMaterial: Record<string, any[]> = {};

        for (const item of data.items) {
          if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error('Cantidad inválida.');
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          
          if (!product || !product.isActive) {
            throw new Error(\`Producto no encontrado o inactivo.\`);
          }
          
          if (!product.material || product.material === 'Por revisar') {
            throw new Error(\`El producto \${product.name} no tiene un material definido (Por revisar). No se puede vender.\`);
          }
          
          const available = product.physicalStock - product.reservedStock;
          if (item.quantity > available) {
            throw new Error(\`Stock insuficiente para \${product.name}. Solo quedan \${available}.\`);
          }
          
          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: {
              reservedStock: { increment: item.quantity }
            }
          });

          if (updatedProduct.reservedStock > updatedProduct.physicalStock) {
            throw new Error(\`Conflicto de concurrencia: Stock agotado para \${product.name}.\`);
          }

          const price = product.price;
          subtotal += price * item.quantity;
          
          const mat = product.material;
          if (!orderItemsByMaterial[mat]) orderItemsByMaterial[mat] = [];
          orderItemsByMaterial[mat].push({
            productId: product.id,
            quantity: item.quantity,
            priceAtTime: price,
            materialSnapshot: mat
          });
        }
        
        const totalAmount = subtotal * (1 - discount);
        const orderNumber = \`PED-\${Math.floor(1000 + Math.random() * 9000)}-\${Date.now().toString().slice(-4)}\`;

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerId: finalCustomerId,
            sellerId: finalSellerId,
            status: 'Reservado',
            totalAmount: totalAmount,
          }
        });
        
        for (const [material, items] of Object.entries(orderItemsByMaterial)) {
           const materialCode = material.substring(0, 3).toUpperCase();
           const group = await tx.orderMaterialGroup.create({
             data: {
                orderId: newOrder.id,
                material,
                groupNumber: \`\${orderNumber}-\${materialCode}\`,
                status: 'Pendiente'
             }
           });
           
           await tx.orderItem.createMany({
             data: items.map(item => ({
               ...item,
               orderId: newOrder.id,
               materialGroupId: group.id
             }))
           });
        }
        
        return await tx.order.findUnique({
           where: { id: newOrder.id },
           include: { items: true, groups: { include: { items: true } } }
        });
      }, {
        maxWait: 5000, 
        timeout: 10000 
      });`;

const regex = /const order = await prisma\.\$transaction\(async \(tx\) => \{[\s\S]*?\}, \{\s*maxWait: 5000,\s*timeout: 10000\s*\}\);/;

code = code.replace(regex, replacement);

fs.writeFileSync('src/app/actions/orders.ts', code);
console.log('orders.ts modified');
