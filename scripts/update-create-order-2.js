const fs = require('fs');
let content = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const oldLoopStart = content.indexOf('let subtotal = 0;');
const oldLoopEnd = content.indexOf('const totalAmount = subtotal * (1 - discount);');

const newLoop = `let subtotal = 0;
            const orderItemsByMaterial: Record<string, any[]> = {};
            const conflicts: any[] = [];

            // Primera pasada: Validaciones
            for (const item of data.items) {
              if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new BusinessLogicError('Cantidad inválida.');
              }
              const product = await tx.product.findUnique({ where: { id: item.productId } });
              if (!product || !product.isActive) {
                conflicts.push({ productId: item.productId, reason: 'Producto inactivo o eliminado', currentStock: 0 });
                continue;
              }
              if (!product.material || product.material === 'Por revisar') {
                conflicts.push({ productId: item.productId, reason: 'Material no definido', currentStock: 0 });
                continue;
              }
              if (product.category === 'Anillos') {
                 if (!item.sizeDetails || item.sizeDetails.length === 0) {
                    throw new BusinessLogicError(\`El anillo \${product.name} requiere al menos una talla.\`);
                 }
                 const sum = item.sizeDetails.reduce((a, b) => a + b.quantity, 0);
                 if (sum !== item.quantity) {
                    throw new BusinessLogicError(\`La suma de las tallas (\${sum}) no coincide con la cantidad total (\${item.quantity}) para el anillo \${product.name}.\`);
                 }
              } else if (item.sizeDetails && item.sizeDetails.length > 0 && product.category !== 'Anillos') {
                 throw new BusinessLogicError(\`El producto \${product.name} no es un anillo, no puede llevar desglose de tallas.\`);
              }
              const available = product.physicalStock - product.reservedStock;
              if (item.quantity > available) {
                conflicts.push({ productId: product.id, reason: 'Stock insuficiente', currentStock: available, currentPrice: product.price });
                continue;
              }
            }
            if (conflicts.length > 0) {
              throw new BusinessLogicError("Conflictos en el inventario o precios.", 'CONFLICT_ERROR', conflicts);
            }

            for (const item of data.items) {
              const product = await tx.product.findUnique({ where: { id: item.productId } });
              if (!product) continue;
              const updatedProduct = await tx.product.update({
                where: { id: product.id },
                data: { reservedStock: { increment: item.quantity } }
              });
              if (updatedProduct.reservedStock > updatedProduct.physicalStock) {
                throw new BusinessLogicError(\`Conflicto de concurrencia: Stock agotado para \${product.name}.\`);
              }
              const price = product.price;
              subtotal += price * item.quantity;
              
              const mat = product.material || 'Otro';
              if (!orderItemsByMaterial[mat]) orderItemsByMaterial[mat] = [];
              orderItemsByMaterial[mat].push({
                productId: product.id,
                quantity: item.quantity,
                priceAtTime: price,
                materialSnapshot: mat,
                sizeDetails: item.sizeDetails || undefined
              });
            }
            
            `;

content = content.substring(0, oldLoopStart) + newLoop + content.substring(oldLoopEnd);

fs.writeFileSync('src/app/actions/orders.ts', content);
