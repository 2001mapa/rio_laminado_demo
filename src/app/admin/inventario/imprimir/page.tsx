'use client';

import { useDemo } from '@/lib/DemoContext';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import QRCode from 'react-qr-code';

export default function MassPrintPage() {
  const { products } = useDemo();
  
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [itemsPerPage, setItemsPerPage] = useState<number>(21); // E.g., 21 tags per batch (7 rows, fits in 4x6 exactly)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [newOnly, setNewOnly] = useState(false);
  const [newSkus, setNewSkus] = useState<string[]>([]);

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

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  const filterOptions = ['Todas', ...categories];

  const filteredProducts = useMemo(() => {
    let base = products;
    if (newOnly && newSkus.length > 0) {
      base = products.filter(p => newSkus.includes(p.sku));
    } else if (categoryFilter !== 'Todas') {
      base = products.filter(p => p.category === categoryFilter);
    }
    return base;
  }, [products, categoryFilter, newOnly, newSkus]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const currentBatch = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const [offsetX, setOffsetX] = useState<number>(3.2);
  const [offsetY, setOffsetY] = useState<number>(1.6);
  const [gapY, setGapY] = useState<number>(3.0);
  const [gapX, setGapX] = useState<number>(3.0);

  return (
    <>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20 font-sans print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link href="/admin/inventario" className="mr-4 p-2 hover:bg-rio-surface-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-rio-ink" />
            </Link>
            <h1 className="text-2xl font-serif font-bold text-rio-ink">Impresión de Etiquetas de Mostrador</h1>
          </div>
          <button
            onClick={() => window.print()}
            disabled={currentBatch.length === 0}
            className="w-full md:w-auto flex justify-center items-center px-6 py-2.5 border border-transparent bg-rio-ink text-white shadow-sm text-sm font-bold rounded-xl hover:bg-rio-ink/90 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Lote Actual
          </button>
        </div>

        <div className="bg-rio-surface-muted border border-rio-border rounded-xl p-4 flex flex-wrap gap-6 items-center">
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
          <div className="text-[10px] text-rio-muted max-w-sm leading-relaxed">
            <strong>Tip:</strong> Si ves que cada fila se imprime un poquito más arriba que la anterior, aumenta la distancia entre filas (+). Y OJO: En opciones de impresión pon <strong>Escala: Personalizado 100%</strong>.
          </div>
        </div>

        <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border space-y-6">
          <div className="flex items-start gap-3 bg-rio-warning/10 border border-rio-warning/30 rounded-xl px-4 py-3.5 mb-2">
            <AlertTriangle className="h-5 w-5 text-rio-warning shrink-0 mt-0.5" />
            <p className="text-[12px] text-rio-warning font-medium leading-relaxed">
              Para no sobrecalentar la máquina térmica ni desgastar el rollo, selecciona una categoría y configura el tamaño de tu lote. Solo se enviará a la impresora el lote de etiquetas visible en pantalla.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-2">Categoría</label>
              <select
                className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background text-rio-ink"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {filterOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-2">Etiquetas por Lote</label>
              <select
                className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background text-rio-ink"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={21}>21 etiquetas (7 filas) - RECOMENDADO</option>
                <option value={42}>42 etiquetas (14 filas)</option>
                <option value={63}>63 etiquetas (21 filas)</option>
                <option value={9999}>Imprimir Todo (¡Cuidado!)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-2">Lote a Imprimir</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-rio-border rounded-lg bg-rio-surface hover:bg-rio-surface-muted disabled:opacity-50 font-bold"
                >
                  &larr;
                </button>
                <span className="flex-1 text-center font-bold text-sm">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-rio-border rounded-lg bg-rio-surface hover:bg-rio-surface-muted disabled:opacity-50 font-bold"
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-rio-border pt-4 text-center">
             <p className="text-sm font-bold text-rio-ink">
               Mostrando etiquetas de la {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)} a la {Math.min(filteredProducts.length, currentPage * itemsPerPage)} (Total: {filteredProducts.length})
             </p>
          </div>
        </div>
      </div>

      <div className="hidden print:block w-[103mm] mx-auto bg-white overflow-hidden">
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
          {currentBatch.map((product, i) => (
            <div 
              key={product.id + '-' + i} 
              className="w-[32mm] h-[16mm] break-inside-avoid flex flex-row items-center justify-between text-black overflow-hidden px-[1mm]"
            >
                {/* QR Code reducido a 12x12mm */}
                <div className="w-[12mm] h-[12mm] min-w-[12mm] flex items-center justify-center bg-white shrink-0">
                  {product.sku && (
                    <QRCode
                      value={product.sku}
                      size={120}
                      level="L"
                      style={{ height: "100%", width: "100%", maxWidth: "100%" }}
                      viewBox={`0 0 120 120`}
                    />
                  )}
                </div>
                {/* Contenedor de textos alineado a la izquierda, textos del mismo tamaño */}
                <div className="flex flex-col items-start justify-center gap-[1px] h-full flex-1 ml-[1.5mm] overflow-hidden">
                  <span className="font-black text-[11px] leading-[1.1] text-left w-full truncate tracking-tighter">{product.sku}</span>
                  <span className="font-black text-[11px] leading-[1.1] text-left w-full truncate tracking-tighter">{formatPrice(product.price)}</span>
                  <span className="font-bold text-[11px] leading-[1.1] text-left w-full truncate tracking-tighter">
                    UB: {product.locationCode || 'N/A'}
                  </span>
                </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
