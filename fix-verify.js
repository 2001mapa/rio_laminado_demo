const fs = require('fs');
let c = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const regex = /const verifyIdempotentContent = \([\s\S]*?return true;\n    };/;
const replacement = `const verifyIdempotentContent = (existingOrder: any) => {
      if (existingOrder.customerId !== finalCustomerId || existingOrder.sellerId !== finalSellerId) {
        throw new Error('Identificador de solicitud inválido o colisión de petición.');
      }
      
      const originalItems = existingOrder.originalPayload as any[] || existingOrder.items;
      
      if (originalItems.length !== data.items.length) {
        throw new Error('El identificador de solicitud ya fue utilizado para un pedido con distinto contenido.');
      }
      
      for (const sentItem of data.items) {
        const match = originalItems.find((ei: any) => ei.productId === sentItem.productId && ei.quantity === sentItem.quantity);
        if (!match) {
           throw new Error('El identificador de solicitud ya fue utilizado para un pedido con distinto contenido.');
        }
        
        if (sentItem.sizeDetails && sentItem.sizeDetails.length > 0) {
           if (!match.sizeDetails || match.sizeDetails.length !== sentItem.sizeDetails.length) {
               throw new Error('El identificador de solicitud ya fue utilizado para un pedido con distintas tallas.');
           }
           for (const sizeInfo of sentItem.sizeDetails) {
               const sizeMatch = match.sizeDetails.find((s: any) => s.size === sizeInfo.size && s.quantity === sizeInfo.quantity);
               if (!sizeMatch) throw new Error('El identificador de solicitud ya fue utilizado para un pedido con distintas tallas.');
           }
        } else if (match.sizeDetails && match.sizeDetails.length > 0) {
           throw new Error('El identificador de solicitud ya fue utilizado para un pedido con distintas tallas.');
        }
      }
      return true;
    };`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/app/actions/orders.ts', c);
