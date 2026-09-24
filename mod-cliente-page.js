const fs = require('fs');

const code = `'use client';

import { useState, useEffect } from 'react';
import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, ShoppingBag, X, MapPin, Tag, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Product } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { ProductCardSkeleton, WelcomeBannerSkeleton } from '@/components/Skeletons';
import Link from 'next/link';
import { OFFICIAL_PRODUCT_TYPES } from '@/lib/constants';

const NEW_ARRIVAL_DAYS = 30;

export default function CatalogoPage() {
  const { products, currentCustomer, isLoaded, cart, orders } = useDemo();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [activeMaterial, setActiveMaterial] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 1. Base visible products (active, photo, stock > 0, not "Por revisar")
  const allVisibleProducts = products.filter(p => p.isActive && p.imageUrl && p.material !== 'Por revisar' && (p.physicalStock - p.reservedStock) > 0);

  // 2. Calculate available materials
  const rawMaterials = Array.from(new Set(allVisibleProducts.map(p => p.material))).filter(Boolean) as string[];
  const canonicalOrder = ['Laminado', 'Plata', 'Rodio'];
  const allAvailableMaterials = canonicalOrder.filter(m => rawMaterials.includes(m));

  // Determine effective material
  let effectiveMaterial = activeMaterial;
  if (allAvailableMaterials.length === 1) {
    effectiveMaterial = allAvailableMaterials[0];
  } else if (!allAvailableMaterials.includes(activeMaterial) && activeMaterial !== 'Todos') {
    effectiveMaterial = allAvailableMaterials.length > 0 ? allAvailableMaterials[0] : 'Todos';
  }

  const showMaterialTabs = allAvailableMaterials.length > 1;
  const clientMaterials = showMaterialTabs ? ['Todos', ...allAvailableMaterials] : [];

  // 3. Calculate available types based on effective material
  const productsForMaterial = allVisibleProducts.filter(p => effectiveMaterial === 'Todos' || p.material === effectiveMaterial);
  // Sort types according to OFFICIAL_PRODUCT_TYPES order
  const rawTypes = Array.from(new Set(productsForMaterial.map(p => p.category))).filter(Boolean);
  const availableTypes = OFFICIAL_PRODUCT_TYPES.filter(t => rawTypes.includes(t));
  // Add any unmatched types at the end just in case
  rawTypes.forEach(t => { if (!OFFICIAL_PRODUCT_TYPES.includes(t)) availableTypes.push(t) });

  let effectiveCategory = activeCategory;
  if (effectiveCategory !== 'Todos' && !availableTypes.includes(effectiveCategory)) {
    effectiveCategory = 'Todos';
  }

  useEffect(() => {
    if (activeMaterial !== effectiveMaterial) setActiveMaterial(effectiveMaterial);
    if (activeCategory !== effectiveCategory) setActiveCategory(effectiveCategory);
  }, [effectiveMaterial, effectiveCategory, activeMaterial, activeCategory]);

  // 4. Final filter
  const filteredProducts = productsForMaterial.filter(p => {
    if (effectiveCategory !== 'Todos' && p.category !== effectiveCategory) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      return p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s);
    }
    return true;
  });

  const discoverProducts = (() => {
    const now = new Date().getTime();
    
    // Group by category
    const byCategory: Record<string, Product[]> = {};
    productsForMaterial.forEach(p => {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    });

    // Sort and limit per category
    const topPerCategory: Record<string, Product[]> = {};
    Object.keys(byCategory).forEach(cat => {
      const sorted = byCategory[cat].sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        const aIsNew = (now - aDate) <= NEW_ARRIVAL_DAYS * 24 * 3600 * 1000 ? 1 : 0;
        const bIsNew = (now - bDate) <= NEW_ARRIVAL_DAYS * 24 * 3600 * 1000 ? 1 : 0;

        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;

        const aStock = a.physicalStock - a.reservedStock;
        const bStock = b.physicalStock - b.reservedStock;
        return bStock - aStock;
      });
      topPerCategory[cat] = sorted.slice(0, 3);
    });

    // Flatten and mix
    const finalSelection: Product[] = [];
    Object.values(topPerCategory).forEach(group => {
      finalSelection.push(...group);
    });

    return finalSelection.sort(() => Math.random() - 0.5).slice(0, 15);
  })();

  const adjustedOrders = orders.filter(o => 
    o.customerId === currentCustomer?.id && 
    o.status === 'VERIFIED' && 
    o.items.some(i => i.originalQuantity && i.originalQuantity !== i.quantity) &&
    !o.customerAcknowledged
  );

  const ProductCard = ({ product, onExpand }: { product: Product, onExpand: () => void }) => {
    const stockDisponible = product.physicalStock - product.reservedStock;
    const isNew = new Date().getTime() - new Date(product.createdAt || 0).getTime() <= NEW_ARRIVAL_DAYS * 24 * 3600 * 1000;
    const cartItem = cart.find(i => i.productId === product.id);
    const qtyInCart = cartItem?.quantity || 0;
    
    return (
      <div className="group bg-white rounded-2xl shadow-sm border border-rio-border hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">
        <div 
          className="relative aspect-square bg-rio-surface-muted overflow-hidden cursor-pointer"
          onClick={onExpand}
        >
          <img 
            src={product.imageUrl || undefined} 
            alt={product.name}
            className={\`w-full h-full object-cover mix-blend-multiply transition-transform duration-500 \${product.hoverImageUrl ? 'group-hover:opacity-0' : 'group-hover:scale-105'}\`}
          />
          {product.hoverImageUrl && (
             <img 
               src={product.hoverImageUrl} 
               alt={product.name}
               className="absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-transform duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
             />
          )}
          
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            <div className="flex flex-col gap-1">
              {isNew && (
                <span className="bg-rio-gold-dark text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                  Nuevo
                </span>
              )}
              {stockDisponible <= 5 && (
                <span className="bg-rio-warning/90 text-rio-ink text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm backdrop-blur-sm">
                  ¡Últimos {stockDisponible}!
                </span>
              )}
            </div>
          </div>
          
          <div className="absolute bottom-2 left-2 flex flex-col gap-1">
            <span className="bg-white/90 backdrop-blur-sm text-rio-muted text-[10px] font-mono px-2 py-0.5 rounded shadow-sm">
              {product.sku}
            </span>
            <span className="bg-white/90 backdrop-blur-sm text-rio-ink text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              {product.material}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="mb-3 flex-1">
            <p className="text-xs font-bold text-rio-gold-dark uppercase tracking-wider mb-1">{product.category}</p>
            <h3 className="font-bold text-rio-ink text-sm leading-snug line-clamp-2 mb-2">{product.name}</h3>
            <p className="text-lg font-black text-rio-ink">{formatPrice(product.price)}</p>
          </div>

          {qtyInCart > 0 ? (
            <div className="flex items-center justify-between bg-rio-surface-muted rounded-xl p-1 border border-rio-border">
              <button 
                onClick={(e) => { e.stopPropagation(); /* remove handled in context */ }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-rio-ink shadow-sm hover:bg-rio-danger/10 hover:text-rio-danger transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-rio-ink w-8 text-center">{qtyInCart}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); /* add handled in context */ }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rio-ink text-white shadow-sm hover:bg-rio-ink/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); /* add handled in context */ }}
              className="w-full flex items-center justify-center py-2.5 bg-white border border-rio-ink text-rio-ink rounded-xl text-xs font-bold hover:bg-rio-ink hover:text-white transition-all active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-2" />
              Agregar al carrito
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-pulse">
        <WelcomeBannerSkeleton />
        <div className="flex gap-4 overflow-x-auto pb-4 border-b border-rio-border/50">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-24 h-8 bg-rio-surface-muted rounded-full shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-10 pb-24 md:pb-8">
      
      {/* Banner Bienvenida */}
      <div className="bg-rio-ink rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl border border-rio-ink/90">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rio-gold via-rio-ink to-rio-ink"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-rio-surface-muted">
            Hola, {currentCustomer?.name.split(' ')[0]}
          </h1>
          <p className="text-rio-surface text-sm md:text-base font-medium opacity-90 max-w-md leading-relaxed">
            Explora nuestro catǭlogo mayorista. Tienes <strong className="text-rio-gold-light">{allVisibleProducts.length}</strong> referencias listas para entrega inmediata.
          </p>
        </div>
      </div>

      <div className="space-y-6 md:space-y-8">
        
        {/* Descubre la coleccin */}
        {discoverProducts.length > 0 && (
          <div className="mb-2 relative group px-1">
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-rio-ink leading-tight">Descubre la coleccin</h2>
              <p className="text-[12px] md:text-sm text-rio-muted mt-0.5 font-medium">Una seleccin disponible para ti</p>
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
                      <img src={product.imageUrl || undefined} className="w-full h-full object-cover mix-blend-multiply" />
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

        {/* Notificaciones de Ajustes */}
        {adjustedOrders.length > 0 && (
          <div className="bg-rio-warning/10 border-2 border-rio-warning/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
            <div className="flex items-start md:items-center mb-4 md:mb-0">
              <div className="bg-rio-warning/20 p-2 rounded-full mr-3 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rio-warning" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rio-ink">Actualizacin de pedidos</h3>
                <p className="text-xs font-medium text-rio-muted mt-0.5 leading-relaxed">
                  Tienes {adjustedOrders.length} pedido{adjustedOrders.length > 1 ? 's' : ''} con cantidades ajustadas por control de calidad o inventario.
                </p>
              </div>
            </div>
            <Link 
              href={adjustedOrders.length === 1 ? \`/cliente/pedido/\${adjustedOrders[0].id}\` : \`/cliente/perfil\`}
              className="bg-white border border-rio-border hover:border-rio-ink text-rio-ink text-xs font-bold px-4 py-2.5 rounded-xl text-center shadow-sm transition-all whitespace-nowrap"
            >
              Ver {adjustedOrders.length === 1 ? 'detalles de ajuste' : 'historial de pedidos'}
            </Link>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="sticky top-14 md:top-0 z-20 bg-rio-background pt-3 pb-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-rio-border/50 md:border-rio-border flex flex-col gap-3">
          
          {/* Material Tabs (Horizontal scroll on mobile) */}
          {showMaterialTabs && (
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
              {clientMaterials.map((mat) => (
                <button
                  key={mat}
                  onClick={() => { setActiveMaterial(mat); setActiveCategory('Todos'); }}
                  className={\`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all \${
                    effectiveMaterial === mat
                      ? 'bg-rio-ink text-white shadow-md'
                      : 'bg-white text-rio-ink border border-rio-border hover:bg-rio-surface-muted'
                  }\`}
                >
                  {mat}
                </button>
              ))}
            </div>
          )}

          {/* Type Select and Search Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <select
              value={effectiveCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-rio-border rounded-xl text-[13px] font-bold text-rio-ink focus:outline-none focus:ring-1 focus:ring-rio-ink md:min-w-[200px]"
            >
              <option value="Todos">Todos los tipos</option>
              {availableTypes.map(type => (
                 <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <div className="relative w-full md:flex-1 md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-rio-muted" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-2.5 border border-rio-border rounded-xl text-sm bg-rio-surface placeholder-rio-muted focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink text-rio-ink shadow-sm"
                  placeholder="Buscar por nombre o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="min-h-[50vh]">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 bg-rio-surface-muted rounded-full flex items-center justify-center mb-4 border border-rio-border">
                <Search className="w-6 h-6 text-rio-muted" />
              </div>
              <h3 className="text-lg font-bold text-rio-ink mb-2">No se encontraron productos</h3>
              <p className="text-rio-muted font-medium">Ajusta los filtros o tǭrminos de bǧsqueda para ver mǭs resultados.</p>
            </div>
          ) : (
            (effectiveCategory === 'Todos' ? availableTypes : [effectiveCategory]).map(category => {
              const categoryProducts = filteredProducts.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category} id={\`category-\${category}\`} className="scroll-mt-36 md:scroll-mt-40 space-y-4 md:space-y-6 mb-12">
                  <div className="flex items-end justify-between border-b border-rio-border/30 pb-2">
                    <h2 className="font-serif text-2xl md:text-3xl text-rio-ink font-bold">{category}</h2>
                    <span className="text-[12px] text-rio-muted font-bold uppercase tracking-wider">{categoryProducts.length} ref.</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
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
    </div>
  );
}`;

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Cliente page updated');
