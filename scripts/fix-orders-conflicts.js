const fs = require('fs');

let content = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

content = content.replace(
`  items: { productId: string; quantity: number; sizeDetails?: { size: string, quantity: number }[] }[];`,
`  items: { productId: string; quantity: number; expectedPrice?: number; sizeDetails?: { size: string, quantity: number }[] }[];`
);

content = content.replace(
`        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code };
        }`,
`        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code, conflicts: error.conflicts };
        }`
);

const newLoop = `            // Primera pasada: Validaciones
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
              if (item.expectedPrice !== undefined && product.price !== item.expectedPrice) {
                conflicts.push({ productId: product.id, reason: 'El precio ha cambiado', currentPrice: product.price, currentStock: product.physicalStock - product.reservedStock });
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
                throw new BusinessLogicError("Conflicto de concurrencia: Stock agotado para " + product.name, 'CONFLICT_ERROR', [{ productId: product.id, reason: 'Stock insuficiente', currentStock: 0 }]);
              }
              const price = product.price;
              subtotal += price * item.quantity;`;

content = content.replace(/\/\/ Primera pasada: Validaciones[\s\S]*?subtotal \+\= price \* item\.quantity;/, newLoop);

fs.writeFileSync('src/app/actions/orders.ts', content);
