'use client';

import { useDemo } from '@/lib/DemoContext';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, AlertTriangle, Settings2, Search, CheckSquare, Square } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import QRCode from 'react-qr-code';

export default function MassPrintPage() {
  const { products } = useDemo();
  
  // -- URL PARAMS --
  const [newOnly, setNewOnly] = useState(false);
  const [newSkus, setNewSkus] = useState<string[]>([]);
  
  // -- FILTERS --
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [materialFilter, setMaterialFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // -- SELECTION & QUANTITIES --
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [labelsPerRef, setLabelsPerRef] = useState<number>(2); // Por defecto 2 (para las 2 maletas)
  
  // -- PRINT MODES & PAGINATION --
  const [itemsPerPage, setItemsPerPage] = useState<number>(21);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // -- SETTINGS --
  const [showSettings, setShowSettings] = useState(false);
  const [offsetX, setOffsetX] = useState<number>(3.2);
  const [offsetY, setOffsetY] = useState<number>(1.6);
  const [gapY, setGapY] = useState<number>(3.0);
  const [gapX, setGapX] = useState<number>(3.0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      if (search.get('new_only') === 'true') {
        setNewOnly(true);
        const stored = localStorage.getItem('rio_new_skus_to_print');
        if (stored) {
           try {
             const parsedSkus = JSON.parse(stored);
             setNewSkus(parsedSkus);
             // Auto-seleccionar los nuevos por defecto
             const newIds = products.filter(p => parsedSkus.includes(p.sku)).map(p => p.id);
             setSelectedIds(new Set(newIds));
           } catch(e) {}
        }
      }
    }
  }, [products]);

  // -- DYNAMIC OPTIONS --
  const availableMaterials = Array.from(new Set(products.map(p => p.material).filter(Boolean))) as string[];
  const categoriesInMaterial = useMemo(() => {
    let p = products;
    if (materialFilter !== 'Todos') p = p.filter(x => x.material === materialFilter);
    return Array.from(new Set(p.map(x => x.category).filter(Boolean))) as string[];
  }, [products, materialFilter]);

  // -- FILTERING --
  const filteredReferences = useMemo(() => {
    let base = products;
    if (newOnly && newSkus.length > 0) {
      base = base.filter(p => newSkus.includes(p.sku));
    }
    if (materialFilter !== 'Todos') {
      base = base.filter(p => p.material === materialFilter);
    }
    if (categoryFilter !== 'Todas') {
      base = base.filter(p => p.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    return base;
  }, [products, categoryFilter, materialFilter, searchQuery, newOnly, newSkus]);

  // -- LABELS CALCULATION --
  const labelsToPrint = useMemo(() => {
    const arr: { product: any, index: number }[] = [];
    // Mantener el orden original de products, pero solo los seleccionados
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    for (const ref of selectedProducts) {
      for (let i = 0; i < labelsPerRef; i++) {
        arr.push({ product: ref, index: i });
      }
    }
    return arr;
  }, [products, selectedIds, labelsPerRef]);

  // -- PAGINATION LOGIC --
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedIds, labelsPerRef, itemsPerPage]);

  const totalPages = Math.ceil(labelsToPrint.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  
  const currentBatchLabels = useMemo(() => {
    if (labelsToPrint.length === 0) return [];
    const start = (safePage - 1) * itemsPerPage;
    return labelsToPrint.slice(start, start + itemsPerPage);
  }, [labelsToPrint, safePage, itemsPerPage]);

  const uniqueReferencesInBatch = new Set(currentBatchLabels.map(l => l.product.id)).size;
  const totalLabels = labelsToPrint.length;

  // -- SELECTION HANDLERS --
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredReferences.forEach(p => next.add(p.id));
    setSelectedIds(next);
  };

  const handleClearFiltered = () => {
    const next = new Set(selectedIds);
    filteredReferences.forEach(p => next.delete(p.id));
    setSelectedIds(next);
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const allFilteredAreSelected = filteredReferences.length > 0 && filteredReferences.every(p => selectedIds.has(p.id));

  return (
    <>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-20 font-sans print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link href="/admin/inventario" className="mr-4 p-2 hover:bg-rio-surface-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-rio-ink" />
            </Link>
            <h1 className="text-2xl font-serif font-bold text-rio-ink">Impresión de Etiquetas</h1>
          </div>
          <button
            onClick={() => window.print()}
            disabled={currentBatchLabels.length === 0}
            className="w-full md:w-auto flex justify-center items-center px-6 py-2.5 border border-transparent bg-rio-ink text-white shadow-sm text-sm font-bold rounded-xl hover:bg-rio-ink/90 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Lote Visible
          </button>
        </div>

        {/* CONTROLES DE CALIBRACIÓN */}
        <div className="bg-rio-surface rounded-2xl border border-rio-border overflow-hidden">
          <button onClick={() => setShowSettings(!showSettings)} className="w-full px-6 py-4 flex items-center justify-between bg-rio-surface-muted hover:bg-rio-border/30 transition-colors">
            <div className="flex items-center gap-2 text-sm font-bold text-rio-ink uppercase tracking-wider">
              <Settings2 className="w-4 h-4" /> Ajustes de Calibración Térmica
            </div>
            <span className="text-rio-muted">{showSettings ? '▲ Ocultar' : '▼ Expandir'}</span>
          </button>
          
          {showSettings && (
            <div className="p-6 flex flex-wrap gap-6 items-center bg-white">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-rio-muted">Mover Horizontal (mm)</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setOffsetX(x => Number((x - 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">-</button>
                  <span className="font-mono text-sm font-bold w-12 text-center">{offsetX}</span>
                  <button onClick={() => setOffsetX(x => Number((x + 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">+</button>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-rio-muted">Mover Vertical (mm)</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setOffsetY(y => Number((y - 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">-</button>
                  <span className="font-mono text-sm font-bold w-12 text-center">{offsetY}</span>
                  <button onClick={() => setOffsetY(y => Number((y + 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">+</button>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-rio-muted">Distancia columnas</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGapX(x => Number((x - 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">-</button>
                  <span className="font-mono text-sm font-bold w-12 text-center">{gapX}</span>
                  <button onClick={() => setGapX(x => Number((x + 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">+</button>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-rio-muted">Distancia filas</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGapY(y => Number((y - 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">-</button>
                  <span className="font-mono text-sm font-bold w-12 text-center">{gapY}</span>
                  <button onClick={() => setGapY(y => Number((y + 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FLUJO PRINCIPAL */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: FILTROS Y SELECCIÓN */}
          <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            
            {/* 1. FILTRAR */}
            <div className="bg-rio-surface rounded-2xl p-5 border border-rio-border shadow-sm shrink-0">
              <h2 className="text-sm font-bold text-rio-ink mb-4 flex items-center gap-2">
                <span className="bg-rio-ink text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span> 
                Filtrar Catálogo
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-rio-muted" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-rio-border rounded-xl bg-rio-background text-sm focus:ring-1 focus:ring-rio-gold focus:border-rio-gold"
                    placeholder="Buscar SKU o nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {availableMaterials.length > 0 && (
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-rio-muted mb-1">Material</label>
                      <select className="w-full border border-rio-border rounded-lg p-2 text-sm bg-rio-background" value={materialFilter} onChange={e => {setMaterialFilter(e.target.value); setCategoryFilter('Todas');}}>
                        <option value="Todos">Todos</option>
                        {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-rio-muted mb-1">Categoría</label>
                    <select className="w-full border border-rio-border rounded-lg p-2 text-sm bg-rio-background" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                      <option value="Todas">Todas</option>
                      {categoriesInMaterial.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SELECCIONAR REFERENCIAS */}
            <div className="bg-rio-surface rounded-2xl border border-rio-border shadow-sm flex flex-col flex-1 overflow-hidden max-h-[500px]">
              <div className="p-5 border-b border-rio-border bg-rio-surface-muted">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-bold text-rio-ink flex items-center gap-2">
                    <span className="bg-rio-ink text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span> 
                    Elegir Referencias
                  </h2>
                  <span className="text-xs font-bold text-rio-gold-dark bg-rio-gold-light/20 px-2 py-1 rounded-lg">
                    {selectedIds.size} seleccionadas
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={allFilteredAreSelected ? handleClearFiltered : handleSelectAllFiltered} 
                    className="flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rio-ink bg-white border border-rio-border rounded-lg hover:bg-rio-surface flex items-center justify-center gap-1.5"
                  >
                    {allFilteredAreSelected ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                    {allFilteredAreSelected ? 'Quitar Filtradas' : 'Marcar Filtradas'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={handleClearAll} 
                      className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rio-danger bg-rio-danger/10 border border-rio-danger/20 rounded-lg hover:bg-rio-danger/20"
                    >
                      Limpiar Todo
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto p-2 space-y-1 flex-1 bg-rio-background">
                {filteredReferences.length === 0 ? (
                  <p className="text-center text-sm text-rio-muted p-8">No hay resultados para el filtro actual.</p>
                ) : (
                  filteredReferences.map(ref => {
                    const isSelected = selectedIds.has(ref.id);
                    return (
                      <label 
                        key={ref.id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-rio-surface border-rio-gold/50' : 'bg-white border-transparent hover:border-rio-border'}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelect(ref.id)}
                          className="text-rio-gold-dark focus:ring-rio-gold w-4 h-4 rounded border-rio-border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <span className="font-bold text-sm text-rio-ink truncate">{ref.sku}</span>
                            <span className="text-[10px] text-rio-muted uppercase font-bold tracking-wider">{ref.material || ''}</span>
                          </div>
                          <span className="text-xs text-rio-muted truncate block">{ref.name}</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: CONFIGURACIÓN Y LOTES */}
          <div className="lg:col-span-7 space-y-6 flex flex-col h-full">
            
            {/* 3. LOTE Y CANTIDADES */}
            <div className="bg-rio-surface rounded-2xl p-5 border border-rio-border shadow-sm flex flex-col h-full">
              <h2 className="text-sm font-bold text-rio-ink mb-4 flex items-center gap-2">
                <span className="bg-rio-ink text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span> 
                Configurar Etiquetas
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-rio-border">
                <div className="bg-rio-background p-4 rounded-xl border border-rio-border">
                  <label className="block text-[11px] uppercase font-bold text-rio-muted mb-2">¿Cuántas etiquetas físicas sacar de cada referencia elegida?</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1" 
                      value={labelsPerRef} 
                      onChange={e => setLabelsPerRef(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 p-2 text-center border border-rio-border rounded-lg text-lg font-black text-rio-ink focus:ring-1 focus:ring-rio-gold focus:border-rio-gold"
                    />
                    <span className="text-sm text-rio-muted font-medium leading-tight">
                      (Ej: Si hay 2 maletas, pon 2.<br/>Saldrán {selectedIds.size * labelsPerRef} etiquetas físicas totales).
                    </span>
                  </div>
                </div>

                <div className="bg-rio-background p-4 rounded-xl border border-rio-border">
                  <label className="block text-[11px] uppercase font-bold text-rio-muted mb-2">Tamaño del Lote de Impresión</label>
                  <select
                    className="w-full border border-rio-border rounded-lg p-2.5 text-sm font-bold text-rio-ink focus:ring-1 focus:ring-rio-gold focus:border-rio-gold"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value={21}>21 etiquetas por hoja (Recomendado)</option>
                    <option value={42}>42 etiquetas (2 hojas)</option>
                    <option value={63}>63 etiquetas (3 hojas)</option>
                  </select>
                </div>
              </div>

              {/* CONTROLES DE PAGINACIÓN COMPACTOS */}
              <div className="bg-rio-surface-muted border border-rio-border rounded-xl p-3 flex items-center justify-between mb-4">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-4 py-2 border border-rio-border rounded-lg bg-white hover:bg-rio-surface disabled:opacity-50 font-bold text-sm">Anterior</button>
                <div className="text-center">
                  <p className="text-base font-black text-rio-ink">
                    Lote {safePage} de {totalPages}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-rio-muted mt-1">
                    {totalLabels > 0 ? `Físicas: ${((safePage - 1) * itemsPerPage) + 1} a ${Math.min(totalLabels, safePage * itemsPerPage)} de ${totalLabels} totales` : '0 seleccionadas'}
                  </p>
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="px-4 py-2 border border-rio-border rounded-lg bg-white hover:bg-rio-surface disabled:opacity-50 font-bold text-sm">Siguiente</button>
              </div>

              {/* VISTA PREVIA COMPACTA */}
              <div className="flex-1 border border-rio-border rounded-xl bg-rio-background p-4 flex flex-col justify-center min-h-[150px]">
                {totalLabels === 0 ? (
                  <div className="text-center text-rio-muted">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-30 text-rio-warning" />
                    <p className="text-sm font-bold">Selecciona al menos una referencia en el Paso 2.</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                     <p className="text-sm text-rio-ink font-medium">Al presionar "Imprimir", la máquina generará únicamente las etiquetas de este lote actual.</p>
                     <p className="text-xs text-rio-muted">El lote contiene {currentBatchLabels.length} etiquetas provenientes de {uniqueReferencesInBatch} referencias distintas.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* RENDER FÍSICO DE ETIQUETAS (IMPRESIÓN TÉRMICA) */}
      <div className="hidden print:block bg-white w-max">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { 
              size: 103mm auto;
              margin: 0; 
            }
            body { 
              margin: 0 !important; 
              padding: 0 !important; 
              background: white;
            }
          }
        `}} />
        <div 
          className="grid grid-cols-3"
          style={{ paddingLeft: `${offsetX}mm`, paddingTop: `${offsetY}mm`, rowGap: `${gapY}mm`, columnGap: `${gapX}mm` }}
        >
          {currentBatchLabels.map((item, i) => (
            <div 
              key={item.product.id + '-' + i} 
              className="w-[32mm] h-[16mm] break-inside-avoid flex flex-row items-center justify-between text-black overflow-hidden px-[1mm]"
            >
                <div className="w-[12mm] h-[12mm] min-w-[12mm] flex items-center justify-center bg-white shrink-0">
                  {item.product.sku && (
                    <QRCode
                      value={item.product.sku}
                      size={120}
                      level="L"
                      style={{ height: "100%", width: "100%", maxWidth: "100%" }}
                      viewBox={`0 0 120 120`}
                    />
                  )}
                </div>
                <div className="flex flex-col items-start justify-center gap-[1px] h-full flex-1 ml-[1.5mm] overflow-hidden">
                  <span className="font-black text-[11px] leading-[1.1] text-left w-full truncate tracking-tighter">{item.product.sku}</span>
                  <span className="font-black text-[11px] leading-[1.1] text-left w-full truncate tracking-tighter">{formatPrice(item.product.price)}</span>
                  <span className="font-bold text-[11px] leading-[1.1] text-left w-full truncate tracking-tighter">
                    UB: {item.product.locationCode || 'N/A'}
                  </span>
                </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
