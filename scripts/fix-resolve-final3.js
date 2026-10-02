const fs = require('fs');
let lines = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8').split('\n');

const handleResolveStr = `
    const handleResolveConflict = async (order: PendingOrder) => {
        let currentProducts = products;
        if (currentProducts.length === 0) {
           currentProducts = (await getOfflineProductsByIds(order.items.map(i => i.productId))) as any[];
        }
        const hydratedCart = order.items.map(i => {
           const p = currentProducts.find((p: any) => p.id === i.productId);
           return p ? { product: p, quantity: i.quantity, sizes: i.sizeDetails } : null;
        }).filter(Boolean) as CartItem[];
        setCartItems(hydratedCart);
        const cust = effectiveCustomers.find((c: any) => c.id === order.customerId);
        if (cust) setSelectedCustomer(cust);
        setCurrentCheckoutId(null);
        setStep(2);
        addToast("Pedido cargado en el carrito para corrección. Se generará un nuevo envío.");
    };
`.split('\n');

const discardIndex = lines.findIndex(l => l.includes('const handleDiscard = async'));
if (discardIndex !== -1) {
    // Insert after handleDiscard block
    let insertIndex = discardIndex;
    while (!lines[insertIndex].includes('};') && insertIndex < lines.length) {
        insertIndex++;
    }
    lines.splice(insertIndex + 1, 0, ...handleResolveStr);
}

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', lines.join('\n'));
