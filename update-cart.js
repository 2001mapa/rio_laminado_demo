const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/carrito/page.tsx', 'utf8');

const regex = /\{cart\.map\(\(item\) => \([\s\S]*?\}\)\}/;

const replacement = `{(() => {
            const grouped = cart.reduce((acc, item) => {
              const mat = item.product.material || 'Por revisar';
              if (!acc[mat]) acc[mat] = [];
              acc[mat].push(item);
              return acc;
            }, {} as Record<string, typeof cart>);
            
            return Object.entries(grouped).map(([material, items]) => (
              <div key={material} className="mb-6 bg-white rounded-2xl border border-rio-border shadow-sm overflow-hidden">
                <div className="bg-rio-surface-muted px-4 py-2 border-b border-rio-border flex justify-between items-center">
                   <h3 className="font-bold text-rio-ink">{material}</h3>
                   <span className="text-xs text-rio-muted">{items.length} referencias</span>
                </div>
                <div className="divide-y divide-rio-border">
                {items.map((item) => (
                  <div key={item.product.id} className="p-4 flex flex-col md:flex-row gap-4 hover:bg-rio-surface/30 transition-colors">
                    <img 
                      src={item.product.imageUrl || undefined} 
                      alt={item.product.name} 
                      className="w-full md:w-24 h-24 object-cover rounded-xl border border-rio-border/50 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-xs font-mono font-medium text-rio-muted mb-1">{item.product.sku}</p>
                            <h3 className="font-bold text-rio-ink text-sm leading-tight mb-2">{item.product.name}</h3>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1.5 text-rio-muted hover:text-rio-danger hover:bg-rio-danger/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {currentCustomer?.showDiscount && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-black text-rio-ink">{formatPrice(item.product.price * (1 - currentCustomer.discount / 100))}</span>
                            <span className="text-xs text-rio-muted line-through">{formatPrice(item.product.price)}</span>
                          </div>
                        )}
                        {!currentCustomer?.showDiscount && (
                          <div className="text-sm font-black text-rio-ink mb-2">
                            {formatPrice(item.product.price)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-rio-border rounded-lg bg-rio-background overflow-hidden">
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="px-3 py-1.5 text-rio-ink hover:bg-rio-surface-muted transition-colors border-r border-rio-border"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-[13px] font-bold text-rio-ink select-none">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="px-3 py-1.5 text-rio-ink hover:bg-rio-surface-muted transition-colors border-l border-rio-border"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] font-medium text-rio-muted">
                          Subtotal: {formatPrice(item.product.price * item.quantity * (currentCustomer?.showDiscount ? (1 - currentCustomer.discount / 100) : 1))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ));
          })()}`;

code = code.replace(regex, replacement);

const avisoText = `
        <div className="bg-rio-surface border border-rio-border p-4 rounded-xl shadow-sm text-sm text-rio-ink">
          <p className="font-bold flex items-center mb-1">
            📦 Información de tu envío
          </p>
          <p className="text-rio-muted">
            Tu compra se enviará en una sola guía. Internamente, procesaremos y empacaremos cada material (Laminado, Plata, Rodio) por separado para mayor seguridad.
          </p>
        </div>
`;
code = code.replace(/<div className="lg:col-span-8 space-y-4">/, '<div className="lg:col-span-8 space-y-4">\n' + avisoText);

fs.writeFileSync('src/app/cliente/carrito/page.tsx', code);
console.log('client cart updated');
