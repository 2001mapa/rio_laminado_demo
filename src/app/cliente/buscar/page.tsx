'use client';

import { useState } from 'react';
import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { Search, ShoppingBag, Plus, Minus } from 'lucide-react';
import { addToast } from '@/lib/toast';

export default function BuscarPage() {
  const { products, addToCart } = useDemo();
  const [query, setQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filteredProducts = query.length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
    : products;

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, q: number) => setQuantities(prev => ({ ...prev, [id]: Math.max(1, q) }));

  const handleAdd = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    addToCart(product, getQty(productId));
    setQty(productId, 1);
    addToast(`${product.name} agregado al carrito`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-rio-gold" />
        </div>
        <input
          type="search"
          autoFocus
          className="block w-full pl-11 pr-4 py-3.5 border border-rio-border rounded-2xl leading-5 bg-rio-surface placeholder-rio-muted focus:outline-none focus:ring-2 focus:ring-rio-gold/40 focus:border-rio-gold text-sm text-rio-ink font-medium shadow-sm"
          placeholder="Nombre, referencia o categoría…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {query.length > 1 && (
          <p className="text-[12px] text-rio-muted font-semibold uppercase tracking-wider mb-2">
            {filteredProducts.length > 0
              ? `${filteredProducts.length} resultado${filteredProducts.length !== 1 ? 's' : ''}`
              : 'Sin resultados'}
          </p>
        )}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white border border-rio-border p-3 md:p-4 rounded-2xl flex gap-4 md:gap-5 hover:border-rio-gold/30 transition-colors shadow-sm relative group overflow-hidden">
                <div className="w-[90px] md:w-[110px] h-[100px] md:h-[120px] rounded-xl overflow-hidden bg-rio-surface shrink-0 border border-rio-border/50 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between mb-0.5">
                      <p className="text-[10px] font-bold text-rio-gold uppercase tracking-wider">{product.sku}</p>
                      {product.lowStock && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rio-danger/10 text-rio-danger rounded-md uppercase tracking-wider">
                          Pocas
                        </span>
                      )}
                    </div>
                    <h3 className="text-[13px] md:text-[14px] font-semibold text-rio-ink leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setQty(product.id, getQty(product.id) - 1)}
                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-rio-border rounded-lg text-rio-ink bg-rio-surface hover:bg-rio-border transition-colors disabled:opacity-50"
                        disabled={getQty(product.id) <= 1}
                      >
                        <Minus className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <span className="text-xs md:text-sm font-semibold w-6 text-center text-rio-ink">{getQty(product.id)}</span>
                      <button 
                        onClick={() => setQty(product.id, getQty(product.id) + 1)}
                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-rio-border rounded-lg text-rio-ink bg-rio-surface hover:bg-rio-border transition-colors"
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleAdd(product.id)}
                      className="w-8 h-8 md:w-9 md:h-9 bg-rio-ink text-white rounded-xl flex items-center justify-center hover:bg-rio-ink/90 transition-colors shadow-sm hover:shadow active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white border border-rio-border rounded-2xl border-dashed">
            <p className="text-sm font-semibold text-rio-ink">No hay productos que coincidan.</p>
            <p className="text-xs text-rio-muted mt-1">Intenta con otros tǸrminos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
