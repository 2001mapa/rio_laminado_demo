const fs = require('fs');

// 1. Fix useCatalogSync.ts
let syncContent = fs.readFileSync('src/lib/useCatalogSync.ts', 'utf8');
syncContent = syncContent.replace(
`const res = await getSyncCatalog(lastProdSync, cursorProd, 200);`,
`const res = await getSyncCatalog(cursorProd, 200);`
);
syncContent = syncContent.replace(
`const res = await getSyncCustomers(lastCustSync, cursorCust, 200);`,
`const res = await getSyncCustomers(cursorCust, 200);`
);
fs.writeFileSync('src/lib/useCatalogSync.ts', syncContent);

// 2. Fix handleResolveConflict missing
let pageContent = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');
// It seems handleResolveConflict was inserted in the wrong place or not visible where it is used.
// Let's just insert it again right before \`return (\`

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
`;

// Remove it if it was incorrectly placed
pageContent = pageContent.replace(/const handleResolveConflict = async \(order: PendingOrder\) => \{[\s\S]*?addToast\("Pedido cargado en el carrito para corrección. Se generará un nuevo envío."\);\s*\};\s*/, '');

pageContent = pageContent.replace(/return \(\s*<div className="flex flex-col h-full">/, handleResolveStr + '\n  return (\n    <div className="flex flex-col h-full">');

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', pageContent);
