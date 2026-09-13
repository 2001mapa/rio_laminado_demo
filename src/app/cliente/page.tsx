'use client';

import { useState, useEffect } from 'react';
import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, ShoppingBag, X, MapPin, Tag } from 'lucide-react';
import { Product } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { ProductCardSkeleton, WelcomeBannerSkeleton } from '@/components/Skeletons';
import Link from 'next/link';

export default function CatalogoPage() {
  const { products, currentCustomer, isLoaded, cart } = useDemo();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-0 md:flex md:gap-8 md:items-start">
        {/* Left Zone: 70% */}
        <div className="md:flex-1 md:min-w-0 space-y-5 md:space-y-8">
          
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

          {/* Category Tabs */}
          <div className="sticky top-14 md:top-0 z-20 bg-rio-background pt-2 pb-0 md:pt-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 shadow-sm md:shadow-none border-b border-rio-border/50 md:border-rio-border">
            <div className="flex overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    if (cat === 'Todos') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      const el = document.getElementById(`category-${cat}`);
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }
                  }}
                  className={`whitespace-nowrap px-4 py-3 md:py-4 text-[13px] md:text-sm font-bold uppercase tracking-wider transition-colors relative ${
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
          </div>

          <div className="space-y-8 md:space-y-12 md:pt-4">
            {categories.filter(c => c !== 'Todos').map(category => {
              const categoryProducts = products.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category} id={`category-${category}`} className="scroll-mt-24 md:scroll-mt-32 space-y-4 md:space-y-6">
                  <div className="flex items-end justify-between border-b border-rio-border/30 pb-2">
                    <h2 className="font-serif text-2xl md:text-3xl text-rio-ink font-bold">{category}</h2>
                    <span className="text-[12px] text-rio-muted font-bold uppercase tracking-wider">{categoryProducts.length} ref.</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
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
            })}
          </div>
        </div>

        {/* Right Zone: 30% Sticky Cart (Desktop Only) */}
        <div className="hidden md:flex w-[320px] lg:w-[380px] shrink-0 sticky top-24 flex-col bg-rio-surface border border-rio-border rounded-2xl overflow-hidden shadow-sm max-h-[calc(100vh-8rem)]">
          <div className="p-5 border-b border-rio-border">
            <h2 className="font-serif text-xl font-bold text-rio-ink">Resumen del Pedido</h2>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1">
            {cart.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag className="w-10 h-10 text-rio-muted/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-rio-ink">Tu pedido está vacío</p>
                <p className="text-[12px] text-rio-muted mt-1">Agrega productos del catálogo para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 items-start">
                    <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover border border-rio-border bg-rio-background" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-rio-ink truncate">{item.product.name}</p>
                      <p className="text-[11px] font-mono text-rio-muted mt-0.5">{item.quantity} x {formatPrice(item.product.price)}</p>
                    </div>
                    <p className="text-[12px] font-bold text-rio-ink whitespace-nowrap">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-5 bg-rio-background border-t border-rio-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-rio-ink uppercase tracking-wider">Total Est.</span>
                <span className="text-xl font-serif font-bold text-rio-gold-dark">{formatPrice(cartTotal)}</span>
              </div>
              <Link 
                href="/cliente/carrito"
                className="w-full py-3.5 bg-rio-ink text-white rounded-xl font-bold text-sm hover:bg-rio-ink/90 transition-colors flex justify-center items-center"
              >
                Revisar y Enviar
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}

function ProductCard({ product, onExpand }: { product: Product; onExpand: () => void }) {
  const { addToCart, cart } = useDemo();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
        className="relative aspect-square md:min-h-[220px] bg-white w-full focus:outline-none"
        aria-label={`Ver detalle de ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
        />
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

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addToCart, cart } = useDemo();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoomState, setZoomState] = useState({ scale: 1, x: 0, y: 0 });
  const [initialPinch, setInitialPinch] = useState<{ dist: number, centerX: number, centerY: number } | null>(null);

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
      
      setZoomState({ scale, x, y });
    }
  };

  useEffect(() => {
    window.history.pushState({ modalOpen: true }, '');
    const onPopState = () => {
      onClose();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onClose]);

  const handleCloseModal = () => {
    window.history.back();
  };

  const handleTouchEnd = () => {
    setInitialPinch(null);
    setZoomState({ scale: 1, x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleCloseModal}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

      {/* Modal Card */}
      <div
        className="relative bg-rio-surface w-full max-w-md rounded-2xl shadow-2xl border border-rio-border animate-slide-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full border border-rio-border text-rio-muted hover:text-rio-ink transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Zoom Hint */}
        {zoomState.scale === 1 && (
          <div className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none transition-opacity">
            Pellizca para acercar
          </div>
        )}

        {/* Image Container with Instagram-style Pop-out Zoom */}
        <div 
          className="relative aspect-[4/3] w-full bg-white shrink-0 rounded-t-2xl z-30"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <img
            src={product.image}
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
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <p className="text-[11px] font-mono font-bold text-rio-muted">{product.sku}</p>
            <h2 className="text-xl font-serif font-bold text-rio-ink mt-1 leading-snug">{product.name}</h2>
            <p className="text-[13px] text-rio-muted font-medium mt-1">{product.category}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-black text-rio-ink">{formatPrice(product.price)}</span>
            {product.lowStock && (
              <span className="inline-flex items-center gap-1 bg-rio-warning/10 border border-rio-warning/20 text-rio-warning text-[11px] font-bold px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                Pocas Unidades
              </span>
            )}
          </div>

          {cartItem && (
            <div className="text-[12px] font-semibold text-rio-gold-dark bg-rio-gold-light/20 border border-rio-gold-light px-3 py-2 rounded-xl">
              Ya tienes <strong>{currentCartQuantity}</strong> unidades de este producto en tu pedido.
            </div>
          )}

          {/* Add to cart */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-12 flex-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-bold flex-1 text-center text-rio-ink">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className={`h-12 flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                added
                  ? 'bg-rio-success text-white'
                  : 'bg-rio-ink text-white hover:bg-rio-ink/90'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {added ? '¡Agregado!' : 'Agregar al Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
