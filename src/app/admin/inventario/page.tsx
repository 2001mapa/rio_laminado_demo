'use client';

import { useDemo } from '@/lib/DemoContext';
import { Plus, Info, X, Printer, Database, Search, MoreVertical, Image as ImageIcon, FileUp, Edit2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import CSVImporter from '@/components/CSVImporter';
import BulkPhotoUploader from '@/components/BulkPhotoUploader';
import CreateProductModal from '@/components/CreateProductModal';
import Link from 'next/link';

export default function InventarioPage() {
  const { products, refreshData } = useDemo();
  const [locationFilter, setLocationFilter] = useState<string>('Todas');
  const [search, setSearch] = useState<string>('');
  const [activeMaterial, setActiveMaterial] = useState<string>('Todos');
  const [showMockModal, setShowMockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // CSV Import Modals
  const [showCSV, setShowCSV] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowActionsMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const locations = Array.from(new Set(products.map(p => p.locationCode).filter(Boolean))) as string[];
  const filterOptions = ['Todas', ...locations, 'Sin ubicación'];

  const filteredProducts = products.filter(p => {
    if (locationFilter !== 'Todas') {
      if (locationFilter === 'Sin ubicación' && p.locationCode) return false;
      if (locationFilter !== 'Sin ubicación' && p.locationCode !== locationFilter) return false;
    }
    if (activeMaterial !== 'Todos' && p.material !== activeMaterial) return false;
    if (search.trim()) {
       const s = search.toLowerCase();
       if (!p.sku.toLowerCase().includes(s) && !p.name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const materials = ['Todos', 'Laminado', 'Plata', 'Rodio', 'Por revisar'];
  const materialCounts = materials.reduce((acc, m) => {
    if (m === 'Todos') acc[m] = products.length;
    else acc[m] = products.filter(p => p.material === m).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-serif font-bold text-rio-ink">Inventario</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSV(true)}
            className="hidden sm:flex items-center px-4 py-2.5 bg-rio-ink text-white text-[13px] font-bold rounded-xl shadow hover:bg-rio-ink/90 transition-colors"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Importar CSV
          </button>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="flex items-center justify-center p-2.5 border border-rio-border text-rio-ink bg-white rounded-xl hover:bg-rio-surface-muted transition-colors shadow-sm"
            >
              <span className="hidden sm:inline mr-2 text-[13px] font-bold">Acciones</span>
              <MoreVertical className="w-4 h-4" />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-rio-border py-2 z-50 animate-scale-in">
                <button 
                  onClick={() => { setShowCSV(true); setShowActionsMenu(false); }}
                  className="w-full text-left sm:hidden px-4 py-2.5 text-sm hover:bg-rio-surface-muted flex items-center text-rio-ink font-medium"
                >
                  <FileUp className="w-4 h-4 mr-3 text-rio-muted" /> Importar CSV
                </button>
                <button 
                  onClick={() => { setShowPhotos(true); setShowActionsMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-rio-surface-muted flex items-center text-rio-ink font-medium"
                >
                  <ImageIcon className="w-4 h-4 mr-3 text-rio-muted" /> Subir fotos por SKU
                </button>
                <Link 
                  href="/admin/inventario/imprimir"
                  onClick={() => setShowActionsMenu(false)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-rio-surface-muted flex items-center text-rio-ink font-medium"
                >
                  <Printer className="w-4 h-4 mr-3 text-rio-muted" /> Imprimir Etiquetas
                </Link>
                <div className="h-px bg-rio-border my-1" />
                <button 
                  onClick={() => { setEditingProduct(null); setShowMockModal(true); setShowActionsMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-rio-surface-muted flex items-center text-rio-ink font-medium"
                >
                  <Plus className="w-4 h-4 mr-3 text-rio-muted" /> Nuevo Producto Manual
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showCSV && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <div className="p-4 border-b border-rio-border flex justify-between items-center sticky top-0 bg-white">
                  <h3 className="font-bold text-lg">Importar CSV</h3>
                  <button onClick={() => setShowCSV(false)}><X className="w-5 h-5" /></button>
               </div>
               <div className="p-4 bg-rio-surface-muted text-xs text-rio-muted border-b border-rio-border leading-relaxed">
                  <strong>Información:</strong> Para referencias existentes, el CSV reemplaza nombre, categoría, precio, cantidad física y ubicación. Conserva fotos, material confirmado, estado de publicación y unidades reservadas. Para referencias nuevas, crea el producto y detecta Laminado, Plata o Rodio a partir del nombre. Si no puede identificar un único material, queda Por revisar.<br/><br/>El archivo debe usar <code>;</code> o <code>,</code> como separador.
               </div>
               <div className="p-6">
                 <CSVImporter onComplete={() => refreshData()} />
               </div>
            </div>
         </div>
      )}
      
      {showPhotos && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <div className="p-4 border-b border-rio-border flex justify-between items-center sticky top-0 bg-white">
                  <h3 className="font-bold text-lg">Subir Fotos</h3>
                  <button onClick={() => setShowPhotos(false)}><X className="w-5 h-5" /></button>
               </div>
               <div className="p-6">
                 <BulkPhotoUploader onComplete={() => refreshData()} />
               </div>
            </div>
         </div>
      )}

      {/* Tabs Materiales */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {materials.map((mat) => (
          <button
            key={mat}
            onClick={() => setActiveMaterial(mat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeMaterial === mat
                ? mat === 'Por revisar' ? 'bg-rio-danger/10 text-rio-danger border border-rio-danger/20' : 'bg-rio-ink text-white shadow-md'
                : 'bg-white text-rio-ink border border-rio-border hover:bg-rio-surface-muted'
            }`}
          >
            {mat}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
               activeMaterial === mat ? (mat === 'Por revisar' ? 'bg-rio-danger/20 text-rio-danger' : 'bg-white/20 text-white') : 'bg-rio-surface-muted text-rio-muted'
            }`}>{materialCounts[mat] || 0}</span>
          </button>
        ))}
      </div>
      
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
         <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rio-muted" />
            <input 
               type="text" 
               placeholder="Buscar por SKU o Nombre..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-9 pr-4 py-2.5 border border-rio-border rounded-xl text-[13px] focus:ring-1 focus:ring-rio-gold focus:border-rio-gold outline-none"
            />
         </div>
         <select
            className="block px-4 py-2.5 border border-rio-border rounded-xl text-[13px] font-medium focus:ring-1 focus:ring-rio-gold focus:border-rio-gold appearance-none bg-white text-rio-ink"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            {filterOptions.map(loc => (
              <option key={loc} value={loc}>{loc === 'Todas' ? 'Todas las ubicaciones' : loc}</option>
            ))}
          </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-rio-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-rio-border">
            <thead className="bg-rio-surface-muted">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider hidden md:table-cell">
                  Categoría
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider hidden md:table-cell">
                  Material
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider">
                  Precio Base
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-rio-muted uppercase tracking-wider hidden sm:table-cell">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-rio-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-rio-border">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-rio-surface/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-rio-surface-muted border border-rio-border/50 overflow-hidden flex items-center justify-center">
                        {product.imageUrl ? (
                          <img className="h-full w-full object-cover mix-blend-multiply" src={product.imageUrl} alt="" />
                        ) : (
                          <span className="text-[9px] font-medium text-rio-muted uppercase">Sin foto</span>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col justify-center">
                        <div className="text-[13px] font-bold text-rio-ink leading-none mb-1">{product.name}</div>
                        <div className="text-[11px] font-mono font-medium text-rio-muted flex items-center gap-2">
                          {product.sku}
                          {!product.isActive && (
                            <span className="bg-rio-danger/10 text-rio-danger px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wider">Inactivo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-rio-muted hidden md:table-cell">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${product.material === 'Por revisar' ? 'bg-rio-danger/10 text-rio-danger border border-rio-danger/20' : 'bg-rio-surface-muted text-rio-ink border border-rio-border'}`}>
                      {product.material || 'Por revisar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-rio-ink">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    {(product.physicalStock - product.reservedStock >= 1 && product.physicalStock - product.reservedStock <= 5) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-rio-warning/10 text-rio-warning border-rio-warning/20">
                        Pocas unidades
                      </span>
                    ) : (product.physicalStock - product.reservedStock <= 0) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-rio-danger/10 text-rio-danger border-rio-danger/20">
                        Agotado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-rio-success/10 text-rio-success border-rio-success/20">
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-bold">
                    <button onClick={() => {
                        setEditingProduct(product);
                        setShowMockModal(true);
                      }} 
                      className="inline-flex items-center text-rio-muted hover:text-rio-gold-dark transition-colors"
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                 <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-rio-muted text-sm font-medium">
                       No se encontraron productos con los filtros seleccionados.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateProductModal 
        isOpen={showMockModal} 
        onClose={() => {
          setShowMockModal(false);
          setEditingProduct(null);
        }}
        initialData={editingProduct}
        onComplete={() => {
          setShowMockModal(false);
          setEditingProduct(null);
          refreshData();
        }}
      />
    </div>
  );
}
