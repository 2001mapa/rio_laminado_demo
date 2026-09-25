'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, ShoppingBag, X, MapPin, Tag, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Product } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { ProductCardSkeleton, WelcomeBannerSkeleton } from '@/components/Skeletons';
import Link from 'next/link';
import { OFFICIAL_PRODUCT_TYPES } from '@/lib/constants';
import { getPagedCatalog } from '@/app/actions/queries';

const NEW_ARRIVAL_DAYS = 30;

export default function CatalogoPage() {
  const { currentCustomer, isLoaded, cart, orders, addToCart } = useDemo();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [activeMaterial, setActiveMaterial] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Pagination state
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);

  const canonicalOrder = ['Laminado', 'Plata', 'Rodio'];
  const allAvailableMaterials = canonicalOrder;
  const showMaterialTabs = allAvailableMaterials.length > 1;
  const clientMaterials = showMaterialTabs ? ['Todos', ...allAvailableMaterials] : [];
  const effectiveMaterial = activeMaterial;

  const categories = ['Todos', ...OFFICIAL_PRODUCT_TYPES];
  const effectiveCategory = activeCategory;

  const fetchProducts = async (reset = false) => {
    setIsLoadingMore(true);
    setFetchError(null);
    try {
      const res: any = await getPagedCatalog({
        material: effectiveMaterial === 'Todos' ? undefined : effectiveMaterial,
        category: effectiveCategory === 'Todos' ? undefined : effectiveCategory,
        search: searchTerm || undefined,
        limit: 24,
        cursor: reset ? undefined : cursor,
      });

      if (res.success && res.products) {
        const fetchedProducts = (res.products as any[]).map((p: any) => ({
          ...p,
          material: p.material ?? undefined,
          imageUrl: p.imageUrl ?? undefined,
          hoverImageUrl: p.hoverImageUrl ?? undefined,
          locationCode: p.locationCode ?? undefined
        })) as Product[];
        setCatalogProducts((prev: Product[]) => reset ? fetchedProducts : [...prev, ...fetchedProducts]);
        setHasMore(res.hasMore ?? false);
        setCursor(res.nextCursor);
      } else {
        setFetchError(res.error || 'Error al cargar productos');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error al cargar productos');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMaterial, effectiveCategory, searchTerm]);

  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader || isLoading || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchProducts();
      }
    }, { threshold: 0.1 });

    observer.observe(currentLoader);

    return () => {
      observer.unobserve(currentLoader);
    };
  }, [isLoading, hasMore, cursor, effectiveMaterial, effectiveCategory, searchTerm]);

  const discoverProducts = catalogProducts.slice(0, 8);

  const adjustedOrders = orders.filter(
    o => o.customerId === currentCustomer?.id && !o.adjustmentAcknowledged && o.items.some(i => !!i.adjustmentReason)
  );

  const selectedProductIndex = selectedProduct ? catalogProducts.findIndex(p => p.id === selectedProduct.id) : -1;
  
  const handlePrevProduct = () => {
    if (selectedProductIndex > 0) setSelectedProduct(catalogProducts[selectedProductIndex - 1]);
  };
  
  const handleNextProduct = () => {
    if (selectedProductIndex < catalogProducts.length - 1) setSelectedProduct(catalogProducts[selectedProductIndex + 1]);
  };

  if (!isLoaded) {
    return (
      <div className="p-4 md:p-0 space-y-5">
        <WelcomeBannerSkeleton />
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {[1,2,3,4].map(i => <div key={i} className="h-9 w-20 shrink-0 bg-rio-border rounded-full animate-pulse" />)}
        </div>
        <div className="flex justify-between items-center">
          <div className="h-7 w-32 bg-rio-border rounded-lg animate-pulse" />
          <div className="h-4 w-20 bg-rio-border rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[1,2,3,4,5,6,7,8,9,10].map(i => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-0 space-y-5 md:space-y-8">
        
        {discoverProducts.length > 0 && (
          <div className="mb-2 relative group px-1">
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-rio-ink leading-tight">Descubre la colección</h2>
              <p className="text-[12px] md:text-sm text-rio-muted mt-0.5 font-medium">Una selección disponible para ti</p>
            </div>

            <div className="relative">
              <button 
                onClick={(e) => { e.preventDefault(); document.getElementById('discover-carousel')?.scrollBy({ left: -300, behavior: 'smooth' }); }}
                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-white border border-rio-border rounded-full shadow-sm text-rio-ink opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 pr-0.5" />
              </button>
              
              <button 
                onClick={(e) => { e.preventDefault(); document.getElementById('discover-carousel')?.scrollBy({ left: 300, behavior: 'smooth' }); }}
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-white border border-rio-border rounded-full shadow-sm text-rio-ink opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5 pl-0.5" />
              </button>

              <div id="discover-carousel" className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {discoverProducts.map(product => (
                  <div 
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="snap-start shrink-0 flex items-center gap-3 w-[240px] md:w-[280px] h-[95px] md:h-[105px] bg-white rounded-xl border border-rio-border shadow-sm cursor-pointer hover:border-rio-gold/40 hover:shadow-md transition-all p-2.5"
                  >
                    <div className="w-[75px] h-[75px] md:w-[85px] md:h-[85px] shrink-0 bg-rio-surface-muted rounded-lg overflow-hidden border border-rio-border/50">
                      <img src={product.imageUrl || undefined} className="w-full h-full object-cover mix-blend-multiply" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="inline-block w-fit text-[9px] font-bold uppercase tracking-wider text-rio-gold-dark bg-rio-gold-light/20 px-1.5 py-0.5 rounded mb-1 truncate max-w-full">{product.category}</span>
                      <p className="text-[12px] md:text-[13px] font-bold text-rio-ink truncate leading-tight mb-0.5">{product.name}</p>
                      <span className="text-[10px] font-mono text-rio-muted block mb-1 truncate">{product.sku}</span>
                      <span className="text-[11px] font-bold text-rio-ink">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adjustedOrders.length > 0 && (
          <div className="bg-rio-warning/10 border-2 border-rio-warning/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
            <div className="flex items-start md:items-center mb-4 md:mb-0">
              <div className="bg-rio-warning/20 p-2 rounded-full mr-3 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rio-warning" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rio-ink">Actualización de pedidos</h3>
                <p className="text-xs font-medium text-rio-muted mt-0.5 leading-relaxed">
                  Tienes {adjustedOrders.length} pedido{adjustedOrders.length > 1 ? 's' : ''} con cantidades ajustadas por control de calidad o inventario.
                </p>
              </div>
            </div>
            <Link 
              href={adjustedOrders.length === 1 ? `/cliente/pedido/${adjustedOrders[0].id}` : `/cliente/perfil`}
              className="bg-white border border-rio-border hover:border-rio-ink text-rio-ink text-xs font-bold px-4 py-2.5 rounded-xl text-center shadow-sm transition-all whitespace-nowrap"
            >
              Ver {adjustedOrders.length === 1 ? 'detalles de ajuste' : 'historial de pedidos'}
            </Link>
          </div>
        )}

        <div className="sticky top-14 md:top-0 z-20 bg-rio-background pt-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-rio-border/50 md:border-rio-border">
          <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
            {clientMaterials.map((mat) => (
              <button
                key={mat}
                onClick={() => { setActiveMaterial(mat); }}
                className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                  activeMaterial === mat
                    ? 'bg-rio-ink text-white shadow-md'
                    : 'bg-white text-rio-ink border border-rio-border hover:bg-rio-surface-muted'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex overflow-x-auto scrollbar-hide flex-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    if (!searchTerm) {
                      if (cat === 'Todos') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        const el = document.getElementById(`category-${cat}`);
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.scrollY - 100;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }
                    }
                  }}
                  className={`whitespace-nowrap px-4 py-2 md:py-3 text-[13px] md:text-sm font-bold uppercase tracking-wider transition-colors relative ${
                    activeCategory === cat
                      ? 'text-rio-ink'
                      : 'text-rio-muted hover:text-rio-ink'
                  }`}
                >
                  {cat}
                  {activeCategory === cat && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] md:h-[3px] bg-rio-ink" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col md:items-end gap-3 w-full md:w-auto shrink-0 md:mb-2">
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-rio-muted" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-2 border border-rio-border rounded-xl text-sm bg-rio-surface placeholder-rio-muted focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink text-rio-ink shadow-sm"
                  placeholder="Buscar por nombre o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div id="catalog-grid" className="space-y-8 md:space-y-12 md:pt-2 scroll-mt-20">
          {searchTerm ? (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-end justify-between border-b border-rio-border/30 pb-2">
                <h2 className="font-serif text-2xl md:text-3xl text-rio-ink font-bold">Resultados de búsqueda</h2>
                <span className="text-[12px] text-rio-muted font-bold uppercase tracking-wider">{catalogProducts.length} ref.</span>
              </div>
              {catalogProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {catalogProducts.map(product => (
                    <ProductCard key={product.id} product={product} onExpand={() => setSelectedProduct(product)} />
                  ))}
                </div>
              ) : (
                !isLoading && (
                  <div className="text-center py-20 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
                    <p className="text-rio-muted font-medium">No se encontraron productos para "{searchTerm}"</p>
                  </div>
                )
              )}
            </div>
          ) : (
            categories.slice(1).map(category => {
              const categoryProducts = catalogProducts.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category} id={`category-${category}`} className="scroll-mt-28 md:scroll-mt-36 space-y-4 md:space-y-6">
                  <div className="flex items-end justify-between border-b border-rio-border/30 pb-2">
                    <h2 className="font-serif text-2xl md:text-3xl text-rio-ink font-bold">{category}</h2>
                    <span className="text-[12px] text-rio-muted font-bold uppercase tracking-wider">{categoryProducts.length} ref.</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                    {categoryProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onExpand={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div ref={loaderRef} className="py-8 flex flex-col items-center justify-center">
            {isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rio-ink"></div>}
            {fetchError && (
              <div className="text-center mt-2">
                <p className="text-red-500 mb-2">{fetchError}</p>
                <button onClick={() => fetchProducts()} className="text-rio-ink underline font-bold">Reintentar</button>
              </div>
            )}
            {!hasMore && catalogProducts.length > 0 && (
              <p className="text-rio-muted text-sm font-medium mt-4">Has llegado al final del catálogo</p>
            )}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onPrev={selectedProductIndex > 0 ? handlePrevProduct : undefined}
          onNext={selectedProductIndex < catalogProducts.length - 1 ? handleNextProduct : undefined}
        />
      )}
    </>
  );
}

function ProductCard({ product, onExpand }: { product: Product; onExpand: () => void }) {
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
    addToast(`${product.name} agregado al carrito`);
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
        aria-label={`Ver detalle de ${product.name}`}
      >
        <img
          src={product.imageUrl || undefined}
          alt={product.name}
          loading="lazy"
          onError={() => setImageError(true)}
          className={`object-cover w-full h-full transition-opacity duration-500 ease-in-out ${showHoverImg || (isHovered && product.hoverImageUrl) ? 'opacity-0' : 'opacity-100'}`}
        />
        {product.hoverImageUrl && (
          <img
            src={product.hoverImageUrl || undefined}
            alt={`${product.name} alternate view`}
            loading="lazy"
            className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-500 ease-in-out ${showHoverImg || (isHovered && product.hoverImageUrl) ? 'opacity-100' : 'opacity-0'}`}
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
          <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold flex-1 text-center text-rio-ink">{quantity}</span>
            <button onClick={() => { const s = product.physicalStock - product.reservedStock; if(quantity + currentCartQuantity < s) setQuantity(quantity + 1); }} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
              added
                ? 'bg-rio-success border-rio-success/30 text-white'
                : 'bg-rio-surface text-rio-ink border-rio-border hover:border-rio-gold hover:text-rio-gold hover:bg-rio-gold/10'
            }`}
            aria-label="Agregar al carrito"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ 
  product, 
  onClose,
  onPrev,
  onNext
}: { 
  product: Product; 
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { addToCart, cart } = useDemo();
  const [quantity, setQuantity] = useState(1);
  const [sizes, setSizes] = useState<{size: string, quantity: number}[]>([]);
  const [sizeInput, setSizeInput] = useState('');
  const [sizeQtyInput, setSizeQtyInput] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoomState, setZoomState] = useState({ scale: 1, x: 0, y: 0 });
  const [initialPinch, setInitialPinch] = useState<{ dist: number, centerX: number, centerY: number } | null>(null);
  const [swipeStart, setSwipeStart] = useState<{ x: number, y: number } | null>(null);
  
  const images = [product.imageUrl];
  if (product.hoverImageUrl) images.push(product.hoverImageUrl);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isAnillo = product.category === 'Anillos';
  const totalAnilloQty = sizes.reduce((acc, s) => acc + s.quantity, 0);

  useEffect(() => {
    setQuantity(1);
    setSizes([]);
    setSizeInput('');
    setSizeQtyInput(1);
    setAdded(false);
    setZoomState({ scale: 1, x: 0, y: 0 });
    setInitialPinch(null);
    setSwipeStart(null);
    setCurrentImageIndex(0);
  }, [product.id]);

  const cartItem = cart.find(item => item.product.id === product.id);
  const currentCartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    const sumOfSizes = isAnillo ? totalAnilloQty : quantity;
    if (isAnillo && sumOfSizes === 0) {
      addToast('Debes agregar al menos una talla');
      return;
    }
    const stockDisponible = product.physicalStock - product.reservedStock;
    if (sumOfSizes + currentCartQuantity > stockDisponible) {
      addToast(`Límite de inventario alcanzado (${stockDisponible} unidades disponibles)`);
      return;
    }
    addToCart(product, sumOfSizes, isAnillo ? sizes : undefined);
    if (!isAnillo) setQuantity(1);
    else setSizes([]);
    
    setAdded(true);
    addToast(`${product.name} agregado al carrito`);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleAddSize = () => {
    if (!sizeInput) return;
    const existingSize = sizes.find(s => s.size === sizeInput);
    if (existingSize) {
      setSizes(sizes.map(s => s.size === sizeInput ? { ...s, quantity: s.quantity + sizeQtyInput } : s));
    } else {
      setSizes([...sizes, { size: sizeInput, quantity: sizeQtyInput }]);
    }
    setSizeInput('');
    setSizeQtyInput(1);
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setSizes(sizes.filter(s => s.size !== sizeToRemove));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setInitialPinch({ dist, centerX, centerY });
    } else if (e.touches.length === 1) {
      setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinch) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      const scale = Math.max(1, dist / initialPinch.dist);
      const x = centerX - initialPinch.centerX;
      const y = centerY - initialPinch.centerY;
      
      setZoomState({ scale: Math.min(scale, 3), x, y });
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleCloseModal = () => {
    onClose();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setInitialPinch(null);
    setZoomState({ scale: 1, x: 0, y: 0 });

    if (swipeStart && e.changedTouches.length === 1) {
      const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      const deltaY = swipeStart.y - touchEnd.y;
      const deltaX = Math.abs(swipeStart.x - touchEnd.x);

      if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > deltaX) {
        if (deltaY > 0 && onNext) {
          onNext();
        } else if (deltaY < 0 && onPrev) {
          onPrev();
        }
      }
    }
    setSwipeStart(null);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleGlobalTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleCloseModal}
      onTouchStart={handleGlobalTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

      <div className="absolute inset-y-2 md:inset-y-4 left-1/2 -translate-x-1/2 flex flex-col justify-between pointer-events-none z-[60]">
        <div className="pointer-events-auto flex justify-center">
          {onPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="p-2 text-white/80 hover:text-white transition-all active:scale-95 animate-bounce"
              aria-label="Anterior producto"
            >
              <ChevronLeft className="w-10 h-10 rotate-90 filter drop-shadow-md" />
            </button>
          )}
        </div>
        <div className="pointer-events-auto flex justify-center">
          {onNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="p-2 text-white/80 hover:text-white transition-all active:scale-95 animate-bounce"
              aria-label="Siguiente producto"
            >
              <ChevronRight className="w-10 h-10 rotate-90 filter drop-shadow-md" />
            </button>
          )}
        </div>
      </div>

      <div
        className="relative bg-rio-surface w-full max-w-md rounded-2xl shadow-2xl border border-rio-border animate-slide-up max-h-[85vh] flex flex-col z-50 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div key={product.id} className="animate-fade-in flex flex-col flex-1">
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full border border-rio-border text-rio-muted hover:text-rio-ink hover:bg-rio-border transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>

          {zoomState.scale === 1 && (
            <div className="absolute top-14 left-4 z-20 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none transition-opacity">
              Pellizca para acercar
            </div>
          )}

        <div 
          className="relative aspect-[9/16] max-h-[55vh] w-full bg-white shrink-0 rounded-t-2xl z-30"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          {images.length > 1 && zoomState.scale === 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-rio-ink shadow-sm hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-rio-ink shadow-sm hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-40">
                {images.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImageIndex ? 'bg-rio-ink' : 'bg-black/30'}`} />
                ))}
              </div>
            </>
          )}

          <img
            src={images[currentImageIndex] || undefined}
            alt={product.name}
            className={`object-cover w-full h-full transition-transform duration-75 origin-center pointer-events-none ${
              zoomState.scale > 1 ? 'rounded-2xl shadow-2xl bg-white relative z-[100]' : 'rounded-t-2xl z-10'
            }`}
            style={{ 
              transform: `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`,
              transition: initialPinch ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          />
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <div>
            <p className="text-[10px] font-mono font-bold text-rio-muted leading-tight">{product.sku}</p>
            <h2 className="text-lg md:text-xl font-serif font-bold text-rio-ink mt-0.5 leading-snug">{product.name}</h2>
            <p className="text-[12px] text-rio-muted font-medium">{product.category}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-black text-rio-ink">{formatPrice(product.price)}</span>
            {(product.physicalStock - product.reservedStock >= 1 && product.physicalStock - product.reservedStock <= 5) && (
              <span className="inline-flex items-center gap-1 bg-rio-warning/10 border border-rio-warning/20 text-rio-warning text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Tag className="w-3 h-3" />
                Pocas Unidades
              </span>
            )}
          </div>

          {cartItem && (
            <div className="text-[11px] font-semibold text-rio-gold-dark bg-rio-gold-light/20 border border-rio-gold-light px-3 py-1.5 rounded-lg">
              Ya tienes <strong>{currentCartQuantity}</strong> unidades en tu pedido.
            </div>
          )}

          {isAnillo ? (
            <div className="space-y-3 pt-2">
              <div className="bg-rio-warning/10 border border-rio-warning/20 p-2 rounded-lg">
                <p className="text-[11px] text-rio-warning font-semibold text-center">Tallas solicitadas, sujetas a confirmación por bodega.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Talla (ej. 6)"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  className="flex-1 h-10 px-3 border border-rio-border rounded-xl text-sm bg-rio-surface focus:outline-none focus:ring-1 focus:ring-rio-ink"
                />
                <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-10 w-24 shrink-0">
                  <button onClick={() => setSizeQtyInput(Math.max(1, sizeQtyInput - 1))} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold flex-1 text-center text-rio-ink">{sizeQtyInput}</span>
                  <button onClick={() => setSizeQtyInput(sizeQtyInput + 1)} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={handleAddSize}
                  disabled={!sizeInput}
                  className="h-10 px-4 bg-rio-ink text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {sizes.length > 0 && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs font-semibold text-rio-ink">Tallas agregadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-rio-surface-muted border border-rio-border px-2.5 py-1.5 rounded-lg text-sm">
                        <span className="font-medium text-rio-ink">T{s.size}</span>
                        <span className="text-rio-muted text-xs">x{s.quantity}</span>
                        <button onClick={() => handleRemoveSize(s.size)} className="ml-1 text-rio-danger hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={sizes.length === 0}
                className={`w-full h-10 mt-2 flex items-center justify-center gap-1.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  added
                    ? 'bg-rio-success text-white'
                    : 'bg-rio-ink text-white hover:bg-rio-ink/90 disabled:opacity-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {added ? '¡Agregado!' : `Agregar al pedido (${totalAnilloQty})`}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-10 flex-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold flex-1 text-center text-rio-ink">{quantity}</span>
                <button onClick={() => { const s = product.physicalStock - product.reservedStock; if(quantity + currentCartQuantity < s) setQuantity(quantity + 1); }} className="w-10 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={`h-10 flex-1 flex items-center justify-center gap-1.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  added
                    ? 'bg-rio-success text-white'
                    : 'bg-rio-ink text-white hover:bg-rio-ink/90'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {added ? '¡Agregado!' : 'Agregar'}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
