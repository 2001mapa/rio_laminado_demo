'use client';

import { useState } from 'react';
import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, ShoppingBag, X, MapPin, Tag } from 'lucide-react';
import { Product } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { ProductCardSkeleton, WelcomeBannerSkeleton } from '@/components/Skeletons';

export default function CatalogoPage() {
  const { products, currentCustomer, isLoaded } = useDemo();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  if (!isLoaded) {
    return (
      <div className="p-4 space-y-5">
        <WelcomeBannerSkeleton />
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {[1,2,3,4].map(i => <div key={i} className="h-9 w-20 shrink-0 bg-rio-border rounded-full animate-pulse" />)}
        </div>
        <div className="flex justify-between items-center">
          <div className="h-7 w-32 bg-rio-border rounded-lg animate-pulse" />
          <div className="h-4 w-20 bg-rio-border rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map(i => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-5">
        {/* Welcome Banner — only shows discount if admin enabled it */}
        {currentCustomer && (
          <div className="bg-rio-surface border border-rio-border rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] text-rio-muted font-bold uppercase tracking-wider">Cliente Mayorista</p>
              <p className="text-sm font-bold text-rio-ink mt-0.5">{currentCustomer.name}</p>
            </div>
            {currentCustomer.showDiscount && currentCustomer.discount > 0 && (
              <div className="bg-rio-gold-light/25 border border-rio-gold-light px-3 py-1.5 rounded-xl text-center">
                <p className="text-[10px] font-bold text-rio-gold-dark uppercase tracking-wider">Descuento</p>
                <p className="text-lg font-black text-rio-gold-dark leading-none">{currentCustomer.discount}%</p>
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex overflow-x-auto pb-1 space-x-2 -mx-4 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-rio-ink text-white shadow-sm'
                  : 'bg-rio-surface border border-rio-border text-rio-muted hover:bg-rio-surface-muted hover:text-rio-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-rio-ink font-bold">Colección</h2>
          <span className="text-[12px] text-rio-muted font-semibold">{filteredProducts.length} referencias</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onExpand={() => setSelectedProduct(product)}
            />
          ))}
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
        className="relative aspect-square bg-rio-surface-muted w-full focus:outline-none"
        aria-label={`Ver detalle de ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity"
        />
        {product.lowStock && (
          <div className="absolute top-2 left-2 bg-rio-warning/10 border border-rio-warning/20 text-rio-warning text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            Pocas Unidades
          </div>
        )}
        {cartItem && (
          <div className="absolute top-2 right-2 bg-rio-ink text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            {currentCartQuantity} en pedido
          </div>
        )}
        {/* Expand hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end justify-end p-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-[9px] font-bold uppercase tracking-wider text-rio-ink px-2 py-1 rounded-full">
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
                : 'bg-rio-surface text-rio-ink border-rio-border hover:border-rio-gold hover:text-rio-gold hover:bg-rio-gold/5'
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
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative bg-rio-surface w-full max-w-lg rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl border border-rio-border animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full border border-rio-border text-rio-muted hover:text-rio-ink transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="aspect-[4/3] w-full bg-rio-surface-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover mix-blend-multiply"
          />
        </div>

        {/* Info */}
        <div className="p-5 space-y-4">
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
