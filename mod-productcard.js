const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const cardRegex = /function ProductCard\(\{\s*product,\s*onExpand\s*\}\s*:\s*\{\s*product:\s*Product;\s*onExpand:\s*\(\)\s*=>\s*void\s*\}\)\s*\{[\s\S]*?(?=function ProductModal)/;

const newProductCard = `function ProductCard({ product, onExpand }: { product: Product; onExpand: () => void }) {
  const { addToCart, cart } = useDemo();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!product.imageUrl || imageError) {
    return null;
  }

  const cartItem = cart.find(item => item.product.id === product.id);
  const currentCartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    const stockDisponible = product.physicalStock - product.reservedStock;
    if (quantity + currentCartQuantity > stockDisponible) {
      addToast('No hay suficiente stock disponible');
      return;
    }
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQuantity(1);
    }, 2000);
  };

  return (
    <div 
      className="group bg-rio-surface rounded-2xl border border-rio-border overflow-hidden hover:border-rio-gold/40 hover:shadow-lg transition-all duration-300 flex flex-col h-full active:scale-[0.98] sm:active:scale-100 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={onExpand}
        className="relative aspect-square md:min-h-[220px] bg-white w-full cursor-pointer focus:outline-none overflow-hidden"
        aria-label={\`Ver detalle de \${product.name}\`}
      >
        <img
          src={product.imageUrl || undefined}
          alt={product.name}
          loading="lazy"
          onError={() => setImageError(true)}
          className={\`object-cover w-full h-full transition-opacity duration-300 ease-in-out \${isHovered && product.hoverImageUrl ? 'opacity-0' : 'opacity-100'}\`}
        />
        {product.hoverImageUrl && (
          <img
            src={product.hoverImageUrl || undefined}
            alt={\`\${product.name} alternate view\`}
            loading="lazy"
            className={\`absolute inset-0 object-cover w-full h-full transition-opacity duration-300 ease-in-out \${isHovered ? 'opacity-100' : 'opacity-0'}\`}
          />
        )}

        {(product.physicalStock - product.reservedStock >= 1 && product.physicalStock - product.reservedStock <= 5) && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center justify-center bg-rio-warning/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">
              <AlertTriangle className="w-2.5 h-2.5 mr-1" strokeWidth={3} />
              Pocas Unidades
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 bg-rio-surface">
        <div className="mb-2">
          <div className="flex items-start justify-between mb-0.5">
            <p className="text-[10px] font-mono font-bold text-rio-muted leading-none">{product.sku}</p>
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-rio-gold-dark bg-rio-gold-light/20 border border-rio-gold-light/50 px-1.5 py-0.5 rounded leading-none truncate max-w-[80px]">
              {product.category}
            </span>
          </div>
          <h3 className="text-sm md:text-[15px] font-bold text-rio-ink leading-tight line-clamp-1 group-hover:text-rio-gold-dark transition-colors">{product.name}</h3>
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[15px] font-black text-rio-ink">{formatPrice(product.price)}</span>
          </div>

          {cartItem && (
            <div className="mb-3 text-[10px] font-semibold text-rio-gold-dark bg-rio-gold-light/20 px-2 py-1 rounded border border-rio-gold-light">
              Tienes <strong>{currentCartQuantity}</strong> und.
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <div className="flex items-center border border-rio-border rounded-lg overflow-hidden bg-rio-background h-8 lg:h-9 flex-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border hover:text-rio-ink transition-colors"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold flex-1 text-center text-rio-ink">{quantity}</span>
              <button 
                onClick={() => {
                  const s = product.physicalStock - product.reservedStock;
                  if(quantity + currentCartQuantity < s) setQuantity(quantity + 1);
                }}
                className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border hover:text-rio-ink transition-colors"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button 
              onClick={handleAdd}
              className={\`h-8 lg:h-9 flex-1 flex items-center justify-center gap-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 \${
                added 
                  ? 'bg-rio-success text-white shadow-inner' 
                  : 'bg-rio-ink text-white hover:bg-rio-ink/90 shadow-sm'
              }\`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {added ? 'Listo' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

`;

if (cardRegex.test(code)) {
  code = code.replace(cardRegex, newProductCard);
  fs.writeFileSync('src/app/cliente/page.tsx', code);
  console.log("Replaced ProductCard successfully.");
} else {
  console.log("Could not find ProductCard regex match.");
}
