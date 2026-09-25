const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const newProductCard = `function ProductCard({ product, onExpand }: { product: Product; onExpand: () => void }) {
  const { addToCart, cart } = useDemo();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showHoverImg, setShowHoverImg] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Si la tarjeta est visible y tiene imagen secundaria, rotamos cada 3s
    if (isVisible && !isHovered && product.hoverImageUrl) {
      interval = setInterval(() => {
        setShowHoverImg(prev => !prev);
      }, 3000);
    } else if (!isVisible) {
      // Si ya no es visible, apagamos la segunda imagen para ahorrar recursos
      setShowHoverImg(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible, isHovered, product.hoverImageUrl]);

  if (!product.imageUrl || imageError) {
    return null;
  }

  const cartItem = cart.find(item => item.product.id === product.id);
  const currentCartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    const stockDisponible = product.physicalStock - product.reservedStock;
    if (quantity + currentCartQuantity > stockDisponible) {
      addToast('Lmite de inventario alcanzado ( unidades disponibles)');
      return;
    }
    addToCart(product, quantity);
    setQuantity(1);
    setAdded(true);
    addToast(\`\${product.name} agregado al carrito\`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div 
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Si no est visible, devolvemos al estado inicial inmediatamente
        if (!isVisible) setShowHoverImg(false);
      }}
      className="bg-rio-surface rounded-2xl overflow-hidden border border-rio-border shadow-sm flex flex-col group hover:shadow-md transition-shadow"
    >
      <button
        onClick={onExpand}
        className="relative aspect-square md:min-h-[220px] bg-white w-full focus:outline-none overflow-hidden"
        aria-label={\`Ver detalle de \${product.name}\`}
      >
        <img
          src={product.imageUrl || undefined}
          alt={product.name}
          loading="lazy"
          onError={() => setImageError(true)}
          className={\`object-cover w-full h-full transition-opacity duration-500 ease-in-out \${showHoverImg || (isHovered && product.hoverImageUrl) ? 'opacity-0' : 'opacity-100'}\`}
        />
        {product.hoverImageUrl && (
          <img
            src={product.hoverImageUrl || undefined}
            alt={\`\${product.name} alternate view\`}
            loading="lazy"
            className={\`absolute inset-0 object-cover w-full h-full transition-opacity duration-500 ease-in-out \${showHoverImg || (isHovered && product.hoverImageUrl) ? 'opacity-100' : 'opacity-0'}\`}
          />
        )}
        {(product.physicalStock - product.reservedStock >= 1 && product.physicalStock - product.reservedStock <= 5) && (
          <div className="absolute top-2 left-2 bg-rio-warning/10 border border-rio-warning/20 text-rio-warning text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            Pocas Unidades
          </div>
        )}
        {cartItem && (
          <div className="absolute top-2 right-2 bg-rio-ink text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
            {currentCartQuantity} en pedido
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end justify-end p-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-[9px] font-bold uppercase tracking-wider text-rio-ink px-2.5 py-1.5 rounded-full shadow-sm">
            Ver detalle
          </div>
        </div>
      </button>

      <div className="p-3.5 flex flex-col flex-1">
        <div className="text-[11px] font-mono font-semibold text-rio-muted mb-1">{product.sku}</div>
        <h3 className="font-medium text-sm text-rio-ink leading-snug mb-2 line-clamp-2">{product.name}</h3>
        <div className="text-[15px] font-bold text-rio-ink mt-auto">{formatPrice(product.price)}</div>
        <div className="mt-3.5 flex items-center gap-2">
          <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">`;

code = code.replace(/function ProductCard\(\{ product, onExpand \}: \{ product: Product; onExpand: \(\) => void \}\) \{[\s\S]*?<div className="mt-3\.5 flex items-center gap-2">\s*<div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">/, newProductCard);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log("Updated ProductCard to re-enable optimized auto-rotation");
