const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/carrito/page.tsx', 'utf8');

// Replace context destructuring to include updateCartItemSize
code = code.replace(
  `const { cart, updateCartQuantity, removeFromCart, currentCustomer, clearCart, addOrder, isLoaded } = useDemo();`,
  `const { cart, updateCartQuantity, updateCartItemSize, removeFromCart, currentCustomer, clearCart, addOrder, isLoaded } = useDemo();`
);

// Replace cart item layout
const targetItem = `<div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-mono font-semibold text-rio-muted">{item.product.sku}</p>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-rio-muted hover:text-rio-danger p-1 -mt-1 -mr-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-medium text-sm text-rio-ink line-clamp-1 mt-0.5">{item.product.name}</h3>
                  {item.sizes && item.sizes.length > 0 && (
                    <p className="text-[11px] text-rio-muted mt-0.5">Tallas: {item.sizes.map(s => \`\${s.size}x\${s.quantity}\`).join(', ')}</p>
                  )}
                  <p className="text-[13px] font-bold text-rio-ink mt-0.5">{formatPrice(item.product.price)}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-8">
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-8 text-center text-rio-ink">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        const stockDisponible = item.product.physicalStock - item.product.reservedStock;
                        if (item.quantity >= stockDisponible) {
                          window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: \`Solo hay \${stockDisponible} unidades disponibles.\`, type: 'error' } }));
                          return;
                        }
                        updateCartQuantity(item.product.id, item.quantity + 1);
                      }}
                      className="w-8 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[13px] text-rio-muted font-bold">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>`;

const newItem = `<div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono font-semibold text-rio-muted truncate">{item.product.sku}</p>
                        <h3 className="font-medium text-sm text-rio-ink line-clamp-1 mt-0.5">{item.product.name}</h3>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-rio-muted hover:text-rio-danger p-1 -mt-1 -mr-1 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[13px] font-bold text-rio-ink mt-0.5">{formatPrice(item.product.price)}</p>
                  </div>
                  
                  {item.product.category === 'Anillos' && item.sizes ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.sizes.map((s, idx) => (
                        <div key={idx} className="flex items-center border border-rio-border rounded-lg overflow-hidden bg-rio-background h-7">
                          <span className="px-2 font-bold text-rio-ink text-xs border-r border-rio-border">T{s.size}</span>
                          <button onClick={() => updateCartItemSize(item.product.id, s.size, s.quantity - 1)} className="w-6 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"><Minus className="w-2.5 h-2.5"/></button>
                          <span className="text-xs font-semibold w-6 text-center text-rio-ink">{s.quantity}</span>
                          <button onClick={() => {
                            const stockDisponible = item.product.physicalStock - item.product.reservedStock;
                            if (item.quantity >= stockDisponible) {
                              window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: \`Solo hay \${stockDisponible} unidades disponibles.\`, type: 'error' } }));
                              return;
                            }
                            updateCartItemSize(item.product.id, s.size, s.quantity + 1);
                          }} className="w-6 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"><Plus className="w-2.5 h-2.5"/></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-8">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-8 text-center text-rio-ink">{item.quantity}</span>
                        <button 
                          onClick={() => {
                            const stockDisponible = item.product.physicalStock - item.product.reservedStock;
                            if (item.quantity >= stockDisponible) {
                              window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: \`Solo hay \${stockDisponible} unidades disponibles.\`, type: 'error' } }));
                              return;
                            }
                            updateCartQuantity(item.product.id, item.quantity + 1);
                          }}
                          className="w-8 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[13px] text-rio-muted font-bold">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  )}
                  {item.product.category === 'Anillos' && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-rio-muted">Total unidades: {item.quantity}</span>
                      <span className="text-[13px] text-rio-muted font-bold">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  )}
                </div>`;

if(code.includes(targetItem)) {
  code = code.replace(targetItem, newItem);
} else {
  // Regex fallback since formatting might differ
  const regex = /<div className="flex-1 flex flex-col justify-between">[\s\S]*?<div className="flex items-center justify-between mt-2">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
  if (code.match(regex)) {
    code = code.replace(regex, newItem);
  }
}

// Replace text message
code = code.replace(
  `Al enviar, tus unidades quedan reservadas para RIO. Podrás modificar tu reserva luego.`,
  `Al enviar, tus unidades quedan reservadas. Solo podrás cancelar el pedido posteriormente desde tu perfil si no ha sido verificado.`
);

// Map sizes to orderData (just to be absolutely certain it's complete)
code = code.replace(
  `items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))`,
  `items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        sizeDetails: item.sizes
      }))`
);

fs.writeFileSync('src/app/cliente/carrito/page.tsx', code);
