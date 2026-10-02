const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const correctResolve = `
    const handleResolveConflict = async (order: PendingOrder) => {
        let currentProducts = products;
        if (currentProducts.length === 0) {
           currentProducts = (await getOfflineProductsByIds(order.items.map(i => i.productId))) as any[];
        }
        const hydratedCart = order.items.map(i => {
           let p = currentProducts.find((p: any) => p.id === i.productId);
           if (!p) {
              // No pierdas artículos que falten en el catálogo
              p = { id: i.productId, name: 'Producto No Encontrado (' + i.productId + ')', price: i.expectedPrice || 0, physicalStock: 0, reservedStock: 0, isActive: false, category: 'Desconocido' } as any;
           }
           return { product: p, quantity: i.quantity, sizes: i.sizeDetails };
        }) as CartItem[];
        setCartItems(hydratedCart);
        
        // Seleccionar cliente original
        let cust = effectiveCustomers.find((c: any) => c.id === order.customerId);
        if (!cust) {
            // No selecciones silenciosamente un cliente distinto
            cust = { id: order.customerId, name: order.customerName, status: 'active', email: null, phone: null } as any;
        }
        setSelectedCustomer(cust);
        
        setCurrentCheckoutId(null);
        setStep(2);
        addToast("Pedido cargado en el carrito para corrección. Generarás un UUID nuevo al confirmar.");
    };`;

content = content.replace(/const handleResolveConflict \= async \(order\: PendingOrder\) \=\> \{[\s\S]*?addToast\(\"Pedido cargado en el carrito para corrección\. Se generará un nuevo envío\."\);\s*\};/m, correctResolve.trim());

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
