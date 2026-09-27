const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Fix the size add button
const sizeAddOld = `                            <button onClick={() => {
                              if(scanSizeInput.trim() && scanSizeQtyInput > 0) {
                                const isDuplicate = scanSizes.some(s => s.size === scanSizeInput.trim());
                                if (isDuplicate) {
                                  setScanSizes(prev => prev.map(s => s.size === scanSizeInput.trim() ? {...s, quantity: s.quantity + scanSizeQtyInput} : s));
                                } else {
                                  setScanSizes([...scanSizes, {size: scanSizeInput.trim(), quantity: scanSizeQtyInput}]);
                                }
                                setScanSizeInput(''); setScanSizeQtyInput(1);
                              }
                            }} className="bg-rio-ink text-white p-2 rounded-xl">`;

const sizeAddNew = `                            <button onClick={() => {
                              if(scanSizeInput.trim() && scanSizeQtyInput > 0) {
                                const currentTotal = scanSizes.reduce((acc, s) => acc + s.quantity, 0);
                                const availableStock = scannedProduct.physicalStock - scannedProduct.reservedStock;
                                const cartExisting = cartItems.find(i => i.product.id === scannedProduct.id);
                                const inCartQty = cartExisting ? cartExisting.quantity : 0;
                                const remainingStock = availableStock - inCartQty;
                                
                                if (currentTotal + scanSizeQtyInput > remainingStock) {
                                  window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: \`Solo quedan \${remainingStock} unidades disponibles.\`, type: 'error' } }));
                                  return;
                                }

                                const isDuplicate = scanSizes.some(s => s.size === scanSizeInput.trim());
                                if (isDuplicate) {
                                  setScanSizes(prev => prev.map(s => s.size === scanSizeInput.trim() ? {...s, quantity: s.quantity + scanSizeQtyInput} : s));
                                } else {
                                  setScanSizes([...scanSizes, {size: scanSizeInput.trim(), quantity: scanSizeQtyInput}]);
                                }
                                setScanSizeInput(''); setScanSizeQtyInput(1);
                              }
                            }} className="bg-rio-ink text-white p-2 rounded-xl">`;

code = code.replace(sizeAddOld, sizeAddNew);

// 2. Fix confirmScan
const confirmScanOld = `  const confirmScan = () => {
    if (!scannedProduct) return;
    
    const isAnillo = scannedProduct.category === 'Anillos';
    const totalAnilloQty = scanSizes.reduce((acc, s) => acc + s.quantity, 0);
    const sumOfSizes = isAnillo ? totalAnilloQty : scanQuantity;

    if (isAnillo && sumOfSizes === 0) {
      addToast('Debes agregar al menos una talla');
      return;
    }
    
    const availableStock = scannedProduct.physicalStock - scannedProduct.reservedStock;
    
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === scannedProduct.id);
      if (existing) {
        return prev.map(item => {
          if (item.product.id === scannedProduct.id) {
            let updatedSizes = item.sizes || [];
            let newTotalQty = item.quantity + sumOfSizes;
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
            };
          }
          return item;
        });
      }
      return [...prev, { 
        product: scannedProduct, 
        quantity: Math.min(availableStock, sumOfSizes),
        sizes: isAnillo ? scanSizes : undefined,
        clearCart: () => {},
        addOrder: async () => {},
        updateOrder: () => {},
        transitionOrder: async () => {},
        acknowledgeAdjustment: async () => {},
        updateCustomer: () => {},
        addSeller: () => {},
        checkoutSeller: async () => {},
        refreshData: async () => {}
      }];
    });
    
    addToast(\`Unidades de \${scannedProduct.name} actualizadas.\`);
    setScannedProduct(null);
    
    if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
  };`;

const confirmScanNew = `  const confirmScan = () => {
    if (!scannedProduct) return;
    
    const isAnillo = scannedProduct.category === 'Anillos';
    const totalAnilloQty = scanSizes.reduce((acc, s) => acc + s.quantity, 0);
    const sumOfSizes = isAnillo ? totalAnilloQty : scanQuantity;

    if (isAnillo && sumOfSizes === 0) {
      addToast('Debes agregar al menos una talla');
      return;
    }
    
    const availableStock = scannedProduct.physicalStock - scannedProduct.reservedStock;
    const existingItem = cartItems.find(item => item.product.id === scannedProduct.id);
    const existingQty = existingItem ? existingItem.quantity : 0;
    
    if (existingQty + sumOfSizes > availableStock) {
       addToast(\`Supera el límite. Solo puedes agregar \${availableStock - existingQty} unidades más.\`);
       return;
    }
    
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === scannedProduct.id);
      if (existing) {
        return prev.map(item => {
          if (item.product.id === scannedProduct.id) {
            let updatedSizes = item.sizes || [];
            
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
              quantity: item.quantity + sumOfSizes,
              sizes: isAnillo ? updatedSizes : item.sizes
            };
          }
          return item;
        });
      }
      return [...prev, { 
        product: scannedProduct, 
        quantity: sumOfSizes,
        sizes: isAnillo ? scanSizes : undefined,
        clearCart: () => {},
        addOrder: async () => {},
        updateOrder: () => {},
        transitionOrder: async () => {},
        acknowledgeAdjustment: async () => {},
        updateCustomer: () => {},
        addSeller: () => {},
        checkoutSeller: async () => {},
        refreshData: async () => {}
      }];
    });
    
    addToast(\`Unidades de \${scannedProduct.name} actualizadas.\`);
    setScannedProduct(null);
    
    if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
  };`;

code = code.replace(confirmScanOld, confirmScanNew);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Fixed stock limit logic for rings and cart');
