const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Expected Price
content = content.replace(
  `        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          sizeDetails: item.sizes,
        })),`,
  `        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          expectedPrice: item.product.price,
          sizeDetails: item.sizes,
        })),`
);

// 2. Conflict UI
const conflictUI = `{order.lastError && <p className="text-xs text-red-500 mt-1">{order.lastError}</p>}
                        {order.status === 'conflict' && order.conflicts && order.conflicts.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100">
                            {order.conflicts.map((c, i) => (
                              <li key={i} className="flex flex-col">
                                <span className="font-bold">Ref: {c.productId}</span>
                                <span>{c.reason}</span>
                                {c.currentStock !== undefined && <span className="text-[10px]">Stock actual en B2B: {c.currentStock}</span>}
                                {c.currentPrice !== undefined && <span className="text-[10px]">Precio actual en B2B: $ {c.currentPrice}</span>}
                              </li>
                            ))}
                          </ul>
                        )}`;

content = content.replace(
  `{order.lastError && <p className="text-xs text-red-500 mt-1">{order.lastError}</p>}`,
  conflictUI
);

// Also pass sellerId to offline functions
content = content.replace(
  `searchOfflineProducts(sku)`,
  `searchOfflineProducts(sku, sellerId)`
);
content = content.replace(
  `searchOfflineCustomers('').then`,
  `searchOfflineCustomers('', sellerId).then`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
