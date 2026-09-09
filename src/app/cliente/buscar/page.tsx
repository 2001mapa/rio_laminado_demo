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
    : [];

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

      {query.length <= 1 && (
        <div className="pt-10 text-center space-y-3">
          <div className="w-16 h-16 bg-rio-surface-muted rounded-full flex items-center justify-center mx-auto border border-rio-border">
            <Search className="w-6 h-6 text-rio-gold" />
          </div>
          <p className="text-sm font-semibold text-rio-ink">Busca cualquier referencia</p>
          <p className="text-[13px] text-rio-muted max-w-[220px] mx-auto leading-relaxed">
            Escribe el nombre del producto, su SKU (ej. ANI-001) o categoría.
          </p>
        </div>
      )}

      {query.length > 1 && (
        <div className="space-y-3">
          <p className="text-[12px] text-rio-muted font-semibold uppercase tracking-wider">
            {filteredProducts.length > 0
              ? `${filteredProducts.length} resultado${filteredProducts.length !== 1 ? 's' : ''}`
              : 'Sin resultados'}
          </p>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3.5 bg-rio-surface p-3.5 rounded-2xl border border-rio-border shadow-sm">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-rio-surface-muted shrink-0 border border-rio-border">
                    <img src={product.image} alt={product.name} className="object-cover h-full w-full mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-bold text-rio-muted leading-none mb-1">{product.sku}</p>
                    <p className="text-sm font-semibold text-rio-ink leading-snug truncate">{product.name}</p>
                    <p className="text-[13px] font-bold text-rio-ink mt-0.5">{formatPrice(product.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-8">
                      <button onClick={() => setQty(product.id, getQty(product.id) - 1)} className="w-7 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-7 text-center text-rio-ink">{getQty(product.id)}</span>
                      <button onClick={() => setQty(product.id, getQty(product.id) + 1)} className="w-7 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleAdd(product.id)}
                      className="flex items-center px-3 py-1.5 bg-rio-ink text-white text-[11px] font-bold rounded-xl hover:bg-rio-ink/90 active:scale-95 transition-all"
                    >
                      <ShoppingBag className="w-3 h-3 mr-1.5" />
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-rio-surface rounded-2xl border border-rio-border border-dashed">
              <p className="text-rio-muted font-medium text-sm">No encontramos "{query}".</p>
              <p className="text-[12px] text-rio-muted mt-1">Intenta con otra referencia o categoría.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
