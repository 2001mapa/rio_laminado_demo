const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const target = `            if (isAnillo && scanSizes.length > 0) {
              const combinedSizes = [...updatedSizes];
              scanSizes.forEach(newSize => {
                const existingSizeIndex = combinedSizes.findIndex(s => s.size === newSize.size);
                if (existingSizeIndex >= 0) {
                  combinedSizes[existingSizeIndex] = { ...combinedSizes[existingSizeIndex], quantity: combinedSizes[existingSizeIndex].quantity + newSize.quantity };
                } else {
                  combinedSizes.push(newSize);
                }
              });
              updatedSizes = combinedSizes;
            }
            return { 
              ...item, 
              quantity: Math.min(availableStock, item.quantity + sumOfSizes),
              sizes: isAnillo ? updatedSizes : item.sizes
            };`;

const replacement = `            let newTotalQty = item.quantity + sumOfSizes;
            if (newTotalQty > availableStock) {
               addToast(\`No se pudo agregar todo. Stock máximo es \${availableStock}.\`);
               return item; // Do not merge if it exceeds, force them to edit it manually or add a valid amount
            }
            
            if (isAnillo && scanSizes.length > 0) {
              const combinedSizes = [...updatedSizes];
              scanSizes.forEach(newSize => {
                const existingSizeIndex = combinedSizes.findIndex(s => s.size === newSize.size);
                if (existingSizeIndex >= 0) {
                  combinedSizes[existingSizeIndex] = { ...combinedSizes[existingSizeIndex], quantity: combinedSizes[existingSizeIndex].quantity + newSize.quantity };
                } else {
                  combinedSizes.push(newSize);
                }
              });
              updatedSizes = combinedSizes;
            }
            
            return { 
              ...item, 
              quantity: newTotalQty,
              sizes: isAnillo ? updatedSizes : item.sizes
            };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed stock clamping for combined sizes.');
