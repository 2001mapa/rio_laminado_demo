'use client';

import { useDemo } from '@/lib/DemoContext';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, AlertTriangle, Settings2, Search, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import QRCode from 'react-qr-code';

export default function MassPrintPage() {
  const { products } = useDemo();
  
  const [newOnly, setNewOnly] = useState(false);
  const [newSkus, setNewSkus] = useState<string[]>([]);
  
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [materialFilter, setMaterialFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [offsetX, setOffsetX] = useState<number>(3.2);
  const [offsetY, setOffsetY] = useState<number>(1.6);
  const [gapY, setGapY] = useState<number>(3.0);
  const [gapX, setGapX] = useState<number>(3.0);
  
  const [itemsPerPage, setItemsPerPage] = useState<number>(21);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [printMode, setPrintMode] = useState<'one_per_ref'|'by_stock'|'custom'>('one_per_ref');
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      if (search.get('new_only') === 'true') {
        setNewOnly(true);
        const stored = localStorage.getItem('rio_new_skus_to_print');
        if (stored) {
           try { setNewSkus(JSON.parse(stored)); } catch(e) {}
        }
      }
    }
  }, []);

  const availableMaterials = Array.from(new Set(products.map(p => p.material).filter(Boolean))) as string[];
  const categoriesInMaterial = useMemo(() => {
    let p = products;
    if (materialFilter !== 'Todos') p = p.filter(x => x.material === materialFilter);
    return Array.from(new Set(p.map(x => x.category).filter(Boolean))) as string[];
  }, [products, materialFilter]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReferences, printMode, customQuantities, itemsPerPage]);

  const labelsToPrint = useMemo(() => {
    const arr: { product: any, index: number }[] = [];
    for (const ref of filteredReferences) {
      let qty = 0;
      if (printMode === 'one_per_ref') qty = 1;
      else if (printMode === 'by_stock') qty = Math.max(0, ref.physicalStock - ref.reservedStock);
      else if (printMode === 'custom') qty = customQuantities[ref.id] !== undefined ? customQuantities[ref.id] : 1;

      for (let i = 0; i < qty; i++) {
        arr.push({ product: ref, index: i });
      }
    }
    return arr;
  }, [filteredReferences, printMode, customQuantities]);

  const totalPages = Math.ceil(labelsToPrint.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  
  const currentBatchLabels = useMemo(() => {
    if (labelsToPrint.length === 0) return [];
    const start = (safePage - 1) * itemsPerPage;
    return labelsToPrint.slice(start, start + itemsPerPage);
  }, [labelsToPrint, safePage, itemsPerPage]);

  const uniqueReferencesInBatch = new Set(currentBatchLabels.map(l => l.product.id)).size;
  const totalLabels = labelsToPrint.length;

  const handleCustomQuantityChange = (id: string, val: string) => {
    const parsed = parseInt(val, 10);
    const qty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setCustomQuantities(prev => ({ ...prev, [id]: qty }));
  };

  const selectAllCustom = (qty: number) => {
    const next: Record<string, number> = { ...customQuantities };
    filteredReferences.forEach(ref => {
      next[ref.id] = qty;
    });
    setCustomQuantities(next);
  };

  return (
    <>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-20 font-sans print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link href="/admin/inventario" className="mr-4 p-2 hover:bg-rio-surface-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-rio-ink" />
            </Link>
            <h1 className="text-2xl font-serif font-bold text-rio-ink">Impresión de Etiquetas de Mostrador</h1>
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

        {/* CONTROLES DE CALIBRACIÓN - DESPLEGABLES */}
        <div className="bg-rio-surface rounded-2xl border border-rio-border overflow-hidden">
          <button onClick={() => setShowSettings(!showSettings)} className="w-full px-6 py-4 flex items-center justify-between bg-rio-surface-muted hover:bg-rio-border/30 transition-colors">
            <div className="flex items-center gap-2 text-sm font-bold text-rio-ink uppercase tracking-wider">
              <Settings2 className="w-4 h-4" /> Ajustes de Calibración
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
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-rio-muted">Distancia entre columnas</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGapX(x => Number((x - 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">-</button>
                  <span className="font-mono text-sm font-bold w-12 text-center">{gapX}</span>
                  <button onClick={() => setGapX(x => Number((x + 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">+</button>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-rio-muted">Distancia entre filas</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGapY(y => Number((y - 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">-</button>
                  <span className="font-mono text-sm font-bold w-12 text-center">{gapY}</span>
                  <button onClick={() => setGapY(y => Number((y + 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center bg-white border border-rio-border rounded-lg font-bold hover:bg-rio-surface">+</button>
                </div>
              </div>
              <div className="text-[10px] text-rio-muted max-w-sm leading-relaxed border-l border-rio-border pl-4">
                <strong>Tip:</strong> OJO: En opciones de impresión del sistema pon <strong>Escala: Personalizado 100%</strong>.
              </div>
            </div>
          )}
        </div>

        {/* FLUJO DE PREPARACIÓN */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            
            {/* 1. FILTRAR REFERENCIAS */}
            <div className="bg-rio-surface rounded-2xl p-5 border border-rio-border shadow-sm">
              <h2 className="text-sm font-bold text-rio-ink mb-4 flex items-center gap-2">
                <span className="bg-rio-ink text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span> 
                Filtrar Referencias
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

                {availableMaterials.length > 0 && (
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-rio-muted mb-1">Material</label>
                    <select className="w-full border border-rio-border rounded-xl p-2 text-sm bg-rio-background" value={materialFilter} onChange={e => {setMaterialFilter(e.target.value); setCategoryFilter('Todas');}}>
                      <option value="Todos">Todos</option>
                      {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted mb-1">Categoría</label>
                  <select className="w-full border border-rio-border rounded-xl p-2 text-sm bg-rio-background" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="Todas">Todas</option>
                    {categoriesInMaterial.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. ELEGIR CANTIDADES */}
            <div className="bg-rio-surface rounded-2xl p-5 border border-rio-border shadow-sm">
              <h2 className="text-sm font-bold text-rio-ink mb-4 flex items-center gap-2">
                <span className="bg-rio-ink text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span> 
                Elegir Cantidades
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-rio-border rounded-xl cursor-pointer hover:bg-rio-surface-muted transition-colors">
                  <input type="radio" name="printMode" value="one_per_ref" checked={printMode === 'one_per_ref'} onChange={() => setPrintMode('one_per_ref')} className="text-rio-gold-dark focus:ring-rio-gold w-4 h-4" />
                  <span className="text-sm font-semibold text-rio-ink">Una etiqueta por referencia</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-rio-border rounded-xl cursor-pointer hover:bg-rio-surface-muted transition-colors">
                  <input type="radio" name="printMode" value="by_stock" checked={printMode === 'by_stock'} onChange={() => setPrintMode('by_stock')} className="text-rio-gold-dark focus:ring-rio-gold w-4 h-4" />
                  <div>
                    <span className="text-sm font-semibold text-rio-ink block">Una por unidad disponible</span>
                    <span className="text-[10px] text-rio-muted">(Excluye stock reservado)</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-rio-border rounded-xl cursor-pointer hover:bg-rio-surface-muted transition-colors">
                  <input type="radio" name="printMode" value="custom" checked={printMode === 'custom'} onChange={() => setPrintMode('custom')} className="text-rio-gold-dark focus:ring-rio-gold w-4 h-4" />
                  <span className="text-sm font-semibold text-rio-ink block">Cantidad personalizada</span>
                </label>
              </div>
            </div>

          </div>

          <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
            {/* 3. REVISAR LOTE */}
            <div className="bg-rio-surface rounded-2xl p-5 border border-rio-border shadow-sm flex flex-col h-full">
              <h2 className="text-sm font-bold text-rio-ink mb-4 flex items-center gap-2">
                <span className="bg-rio-ink text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span> 
                Revisar y Agrupar Lotes
              </h2>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-[11px] uppercase font-bold text-rio-muted mb-1">Etiquetas por Lote</label>
                  <select
                    className="border border-rio-border rounded-xl p-2 text-sm bg-rio-background max-w-[250px]"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value={21}>21 etiquetas (Recomendado)</option>
                    <option value={42}>42 etiquetas</option>
                    <option value={63}>63 etiquetas</option>
                    <option value={9999}>Imprimir Todo (¡Peligro!)</option>
                  </select>
                </div>
                
                {printMode === 'custom' && (
                  <div className="flex gap-2 self-end">
                    <button onClick={() => selectAllCustom(1)} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rio-ink bg-rio-background border border-rio-border rounded-lg hover:bg-rio-surface-muted">Todas a 1</button>
                    <button onClick={() => selectAllCustom(0)} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rio-danger bg-rio-danger/10 border border-rio-danger/20 rounded-lg hover:bg-rio-danger/20">Limpiar</button>
                  </div>
                )}
              </div>

              {/* CONTROLES DE PAGINACIÓN COMPACTOS */}
              <div className="bg-rio-surface-muted border border-rio-border rounded-xl p-3 flex items-center justify-between mb-4">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-3 py-1.5 border border-rio-border rounded-lg bg-white hover:bg-rio-surface disabled:opacity-50 font-bold text-sm">Anterior</button>
                <div className="text-center">
                  <p className="text-sm font-black text-rio-ink">
                    Lote {safePage} de {totalPages}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rio-muted">
                    {totalLabels > 0 ? `Etiq. ${((safePage - 1) * itemsPerPage) + 1} - ${Math.min(totalLabels, safePage * itemsPerPage)} de ${totalLabels} totales` : '0 etiquetas'}
                  </p>
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="px-3 py-1.5 border border-rio-border rounded-lg bg-white hover:bg-rio-surface disabled:opacity-50 font-bold text-sm">Siguiente</button>
              </div>

              {/* VISTA PREVIA COMPACTA */}
              <div className="flex-1 border border-rio-border rounded-xl overflow-hidden bg-rio-background flex flex-col max-h-[400px]">
                {filteredReferences.length === 0 ? (
                  <div className="p-8 text-center m-auto text-rio-muted">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-bold">No se encontraron referencias con estos filtros.</p>
                  </div>
                ) : totalLabels === 0 ? (
                  <div className="p-8 text-center m-auto text-rio-muted">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50 text-rio-warning" />
                    <p className="text-sm font-bold">No se generarán etiquetas.</p>
                    <p className="text-[11px] mt-1">Ajusta el modo de cantidades o verifica el stock.</p>
                  </div>
                ) : (
                  <div className="overflow-auto p-4 space-y-2">
                    {filteredReferences.map(ref => {
                      const qtyRequested = printMode === 'one_per_ref' ? 1 
                        : printMode === 'by_stock' ? Math.max(0, ref.physicalStock - ref.reservedStock)
                        : (customQuantities[ref.id] !== undefined ? customQuantities[ref.id] : 1);
                      
                      const qtyInBatch = currentBatchLabels.filter(l => l.product.id === ref.id).length;

                      if (qtyRequested === 0 && printMode !== 'custom') return null;

                      return (
                        <div key={ref.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border ${qtyInBatch > 0 ? 'bg-rio-surface border-rio-gold/30' : 'bg-white border-rio-border opacity-70'} gap-2`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-rio-ink">{ref.sku}</span>
                              {qtyInBatch > 0 && <span className="text-[9px] uppercase font-bold tracking-wider text-rio-gold-dark bg-rio-gold-light/20 px-1.5 rounded">En este lote</span>}
                            </div>
                            <span className="text-xs text-rio-muted truncate block max-w-[200px]">{ref.name}</span>
                            <span className="text-[10px] font-bold text-rio-muted uppercase tracking-wider block">{ref.material || 'N/A'} - {ref.category}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {printMode === 'custom' ? (
                              <div className="flex items-center">
                                <span className="text-[10px] font-bold text-rio-muted uppercase tracking-wider mr-2">CANT:</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={customQuantities[ref.id] !== undefined ? customQuantities[ref.id] : 1}
                                  onChange={e => handleCustomQuantityChange(ref.id, e.target.value)}
                                  className="w-16 p-1 border border-rio-border rounded text-center text-sm font-bold bg-white"
                                />
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="block text-sm font-black text-rio-ink">{qtyRequested} etiq.</span>
                                <span className="block text-[10px] text-rio-muted uppercase font-bold">{ref.physicalStock - ref.reservedStock} disp.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="text-center mt-3 text-xs text-rio-muted">
                {uniqueReferencesInBatch} referencias en este lote físico
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
