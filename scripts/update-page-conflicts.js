const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const importRegex = /import \{ getExactProductBySku, getPagedCatalog, getProductsByIds \} from '@\/app\/actions\/queries';\nimport \{ useCatalogSync \} from '@\/lib\/useCatalogSync';\nimport \{ searchOfflineProducts, searchOfflineCustomers \} from '@\/lib\/offlineQueue';/;

content = content.replace(importRegex, `import { getExactProductBySku, getPagedCatalog, getProductsByIds } from '@/app/actions/queries';\nimport { useCatalogSync } from '@/lib/useCatalogSync';\nimport { searchOfflineProducts, searchOfflineCustomers, getOfflineProductsByIds } from '@/lib/offlineQueue';`);

const discardFunc = `    const handleDiscard = async (orderId: string) => {
        if (confirm("¿Seguro que deseas descartar este borrador fallido?")) {
           await removePendingOrder(orderId);
           if (sellerId) getPendingOrders(sellerId).then(setPendingQueue);
        }
    };`;

const resolveFunc = `    const handleDiscard = async (orderId: string) => {
        if (confirm("¿Seguro que deseas descartar este borrador fallido?")) {
           await removePendingOrder(orderId);
           if (sellerId) getPendingOrders(sellerId).then(setPendingQueue);
        }
    };

    const handleResolveConflict = async (order: PendingOrder) => {
        let currentProducts = products;
        if (currentProducts.length === 0) {
           currentProducts = (await getOfflineProductsByIds(order.items.map(i => i.productId))) as any[];
        }
        const hydratedCart = order.items.map(i => {
           const p = currentProducts.find(p => p.id === i.productId);
           return p ? { product: p, quantity: i.quantity, sizes: i.sizeDetails } : null;
        }).filter(Boolean) as CartItem[];
        setCartItems(hydratedCart);
        const cust = effectiveCustomers.find(c => c.id === order.customerId);
        if (cust) setSelectedCustomer(cust);
        setCurrentCheckoutId(null);
        setStep(2);
        addToast("Pedido cargado en el carrito para corrección. Se generará un nuevo envío.");
    };`;

content = content.replace(discardFunc, resolveFunc);

// Add UI for conflict order
const orderUIRegex = /\{order\.status === 'failed_fatal' && \(\s*<button onClick=\{\(\) => handleDiscard\(order\.clientRequestId\)\}[^>]*>\s*Descartar\s*<\/button>\s*\)\}/;

const newOrderUI = `{order.status === 'failed_fatal' && (
                            <button onClick={() => handleDiscard(order.clientRequestId)} className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-100">
                              Descartar
                            </button>
                          )}
                          {order.status === 'conflict' && (
                            <>
                              <button onClick={() => handleResolveConflict(order)} className="px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-100">
                                Revisar/Corregir
                              </button>
                              <button onClick={() => handleDiscard(order.clientRequestId)} className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-100">
                                Descartar
                              </button>
                            </>
                          )}`;

content = content.replace(orderUIRegex, newOrderUI);

// Display conflict details in the queue
const errorTextRegex = /<p className="text-xs text-rio-ink\/70 mt-1 line-clamp-2">\{order\.lastError\}<\/p>/;
const newErrorText = `<p className="text-xs text-rio-ink/70 mt-1 line-clamp-2">{order.lastError}</p>
                        {order.status === 'conflict' && (order as any).conflicts && (
                           <div className="mt-2 text-xs bg-yellow-50/50 p-2 rounded border border-yellow-100">
                              <p className="font-medium text-yellow-800 mb-1">Conflictos detectados:</p>
                              <ul className="list-disc pl-4 text-yellow-700">
                                {((order as any).conflicts).map((c: any, i: number) => (
                                   <li key={i}>{c.reason} (Stock disponible: {c.currentStock ?? '?'})</li>
                                ))}
                              </ul>
                           </div>
                        )}`;

content = content.replace(errorTextRegex, newErrorText);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
