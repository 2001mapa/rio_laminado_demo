'use client';

import { useState, useEffect } from 'react';
import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, ShoppingBag, X, MapPin, Tag, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Product } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { ProductCardSkeleton, WelcomeBannerSkeleton } from '@/components/Skeletons';
import Link from 'next/link';

export default function CatalogoPage() {
  const { products, currentCustomer, isLoaded, cart, orders } = useDemo();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const adjustedOrders = orders.filter(
    o => o.customerId === currentCustomer?.id && !o.adjustmentAcknowledged && o.items.some(i => !!i.adjustmentReason)
  );

  const selectedProductIndex = selectedProduct ? filteredProducts.findIndex(p => p.id === selectedProduct.id) : -1;
  
  const handlePrevProduct = () => {
    if (selectedProductIndex > 0) setSelectedProduct(filteredProducts[selectedProductIndex - 1]);
  };
  
  const handleNextProduct = () => {
    if (selectedProductIndex < filteredProducts.length - 1) setSelectedProduct(filteredProducts[selectedProductIndex + 1]);
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
        
        {/* Welcome Banner */}
        {currentCustomer && (
          <div className="bg-rio-surface border border-rio-border rounded-2xl px-5 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center justify-between shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[11px] text-rio-muted font-bold uppercase tracking-[0.2em] mb-1">Cliente Mayorista</p>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-rio-ink">{currentCustomer.name}</h1>
            </div>
            {currentCustomer.showDiscount && currentCustomer.discount > 0 && (
              <div className="mt-4 md:mt-0 relative z-10 flex flex-col items-start md:items-end">
                <p className="text-[10px] font-bold text-rio-gold-dark uppercase tracking-wider mb-1">Descuento Activo</p>
                <div className="bg-rio-gold-light/20 border border-rio-gold-light px-4 py-1.5 rounded-lg">
                  <p className="text-xl md:text-2xl font-black text-rio-gold-dark leading-none">{currentCustomer.discount}% OFF</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notificaciones de Ajustes */}
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

        {/* Category Tabs & Search */}
        <div className="sticky top-14 md:top-0 z-20 bg-rio-background pt-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-rio-border/50 md:border-rio-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Categories */}
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
            
            {/* Search */}
            <div className="relative w-full md:w-72 shrink-0 md:mb-2">
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

        {/* Product Grid */}
        <div className="space-y-8 md:space-y-12 md:pt-2">
          {searchTerm ? (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-end justify-between border-b border-rio-border/30 pb-2">
                <h2 className="font-serif text-2xl md:text-3xl text-rio-ink font-bold">Resultados de búsqueda</h2>
                <span className="text-[12px] text-rio-muted font-bold uppercase tracking-wider">{filteredProducts.length} ref.</span>
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onExpand={() => setSelectedProduct(product)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
                  <p className="text-rio-muted font-medium">No se encontraron productos para "{searchTerm}"</p>
                </div>
              )}
            </div>
          ) : (
            categories.filter(c => c !== 'Todos').map(category => {
              const categoryProducts = filteredProducts.filter(p => p.category === category);
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
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onPrev={selectedProductIndex > 0 ? handlePrevProduct : undefined}
          onNext={selectedProductIndex < filteredProducts.length - 1 ? handleNextProduct : undefined}
        />
      )}
    </>
  );
}

function ProductCard({ product, onExpand }: { product: Product; onExpand: () => void }) {
  const { addToCart, cart } = useDemo();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showAlt, setShowAlt] = useState(false);

  useEffect(() => {
    if (product.hoverImage) {
      const interval = setInterval(() => {
        setShowAlt(prev => !prev);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [product.hoverImage]);

  const cartItem = cart.find(item => item.product.id === product.id);
  const currentCartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    if (quantity + currentCartQuantity > 50) {
      addToast('Límite de inventario alcanzado (50 unidades)');
      return;
    }
    addToCart(product, quantity);
    setQuantity(1);
    setAdded(true);
    addToast(`${product.name} agregado al carrito`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-rio-surface rounded-2xl overflow-hidden border border-rio-border shadow-sm flex flex-col group hover:shadow-md transition-shadow">
      {/* Clickable image */}
      <button
        onClick={onExpand}
        className="relative aspect-square md:min-h-[220px] bg-white w-full focus:outline-none overflow-hidden"
        aria-label={`Ver detalle de ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className={`object-cover w-full h-full transition-opacity duration-[1500ms] ease-in-out ${showAlt ? 'opacity-0' : 'opacity-100'}`}
        />
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt={`${product.name} alternate view`}
            className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-[1500ms] ease-in-out ${showAlt ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {product.lowStock && (
          <div className="absolute top-2 left-2 bg-rio-warning/10 border border-rio-warning/20 text-rio-warning text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            Pocas Unidades
          </div>
        )}
        {cartItem && (
          <div className="absolute top-2 right-2 bg-rio-ink text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
            {currentCartQuantity} en pedido
          </div>
        )}
        {/* Expand hint */}
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
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
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
  const [added, setAdded] = useState(false);
  const [zoomState, setZoomState] = useState({ scale: 1, x: 0, y: 0 });
  const [initialPinch, setInitialPinch] = useState<{ dist: number, centerX: number, centerY: number } | null>(null);
  const [swipeStart, setSwipeStart] = useState<{ x: number, y: number } | null>(null);
  
  const images = [product.image];
  if (product.hoverImage) images.push(product.hoverImage);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setQuantity(1);
    setAdded(false);
    setZoomState({ scale: 1, x: 0, y: 0 });
    setInitialPinch(null);
    setSwipeStart(null);
    setCurrentImageIndex(0);
  }, [product.id]);

  const cartItem = cart.find(item => item.product.id === product.id);
  const currentCartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    if (quantity + currentCartQuantity > 50) {
      addToast('Límite de inventario alcanzado (50 unidades)');
      return;
    }
    addToCart(product, quantity);
    setQuantity(1);
    setAdded(true);
    addToast(`${product.name} agregado al carrito`);
    setTimeout(() => setAdded(false), 1500);
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
    const onPopState = () => {
      onClose();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onClose]);

  const handleCloseModal = () => {
    window.history.back();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setInitialPinch(null);
    setZoomState({ scale: 1, x: 0, y: 0 });

    // Swipe navigation logic
    if (swipeStart && e.changedTouches.length === 1) {
      const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      const deltaY = swipeStart.y - touchEnd.y;
      const deltaX = Math.abs(swipeStart.x - touchEnd.x);

      if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > deltaX) {
        if (deltaY > 0 && onNext) {
          onNext(); // Swipe Up -> Next
        } else if (deltaY < 0 && onPrev) {
          onPrev(); // Swipe Down -> Prev
        }
      }
    }
    setSwipeStart(null);
  };

  useEffect(() => {
    // Lock body scroll when modal is open
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

      {/* Navigation Arrows (Up / Down) */}
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

      {/* Modal Card */}
      <div
        className="relative bg-rio-surface w-full max-w-md rounded-2xl shadow-2xl border border-rio-border animate-slide-up max-h-[85vh] flex flex-col z-50"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full border border-rio-border text-rio-muted hover:text-rio-ink hover:bg-rio-border transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Zoom Hint */}
        {zoomState.scale === 1 && (
          <div className="absolute top-14 left-4 z-20 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none transition-opacity">
            Pellizca para acercar
          </div>
        )}

        {/* Image Container with Instagram-style Pop-out Zoom */}
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
            src={images[currentImageIndex]}
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

        {/* Info Container */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <div>
            <p className="text-[10px] font-mono font-bold text-rio-muted leading-tight">{product.sku}</p>
            <h2 className="text-lg md:text-xl font-serif font-bold text-rio-ink mt-0.5 leading-snug">{product.name}</h2>
            <p className="text-[12px] text-rio-muted font-medium">{product.category}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-black text-rio-ink">{formatPrice(product.price)}</span>
            {product.lowStock && (
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

          {/* Add to cart */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-10 flex-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold flex-1 text-center text-rio-ink">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
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
        </div>
      </div>
    </div>
  );
}
