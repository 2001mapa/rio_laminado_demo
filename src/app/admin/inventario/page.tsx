'use client';

import { useDemo } from '@/lib/DemoContext';
import { Plus, Upload, Info, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export default function InventarioPage() {
  const { products } = useDemo();
  const [locationFilter, setLocationFilter] = useState<string>('Todas');
  const [showMockModal, setShowMockModal] = useState(false);

  const locations = Array.from(new Set(products.map(p => p.locationCode).filter(Boolean))) as string[];
  const filterOptions = ['Todas', ...locations, 'Sin ubicación'];

  const filteredProducts = products.filter(p => {
    if (locationFilter === 'Todas') return true;
    if (locationFilter === 'Sin ubicación') return !p.locationCode;
    return p.locationCode === locationFilter;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      {/* Demo notice */}
      <div className="flex items-start gap-3 bg-rio-gold-light/20 border border-rio-gold-light rounded-xl px-4 py-3.5">
        <Info className="h-4 w-4 text-rio-gold-dark shrink-0 mt-0.5" />
        <p className="text-[12px] text-rio-gold-dark font-medium leading-snug">
          Pantalla demostrativa. Importar CSV y crear productos son acciones simuladas sin conexión real.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-serif font-bold text-rio-ink">Inventario</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="block pl-3 pr-8 py-2.5 border border-rio-border rounded-xl text-[13px] font-medium focus:ring-1 focus:ring-rio-gold focus:border-rio-gold appearance-none bg-rio-surface text-rio-ink"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            {filterOptions.map(loc => (
              <option key={loc} value={loc}>{loc === 'Todas' ? 'Todas las ubicaciones' : loc}</option>
            ))}
          </select>
          <button
            onClick={() => alert('Acción simulada. El CSV debe incluir: sku, nombre, precio, categoría, ubicación.')}
            className="hidden md:flex items-center px-4 py-2.5 border border-rio-border text-[13px] font-semibold rounded-xl text-rio-ink bg-rio-surface hover:bg-rio-surface-muted transition-colors"
          >
            <Upload className="w-4 h-4 mr-2 text-rio-muted" />
            Importar CSV
          </button>
          <button
            onClick={() => setShowMockModal(true)}
            className="flex items-center px-4 py-2.5 border border-transparent text-[13px] font-semibold rounded-xl text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-rio-surface rounded-2xl shadow-sm border border-rio-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-rio-border">
            <thead className="bg-rio-background">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Ref / Producto</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider hidden md:table-cell">Categoría</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider hidden sm:table-cell">Stock</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-rio-muted uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-rio-surface divide-y divide-rio-border">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-rio-surface-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 bg-rio-surface-muted rounded-xl border border-rio-border overflow-hidden">
                        <img src={product.image} alt="" className="h-full w-full object-cover mix-blend-multiply" />
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-bold text-rio-muted">{product.sku}</div>
                        <div className="text-[13px] font-semibold text-rio-ink">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.locationCode ? (
                      <span className="text-[13px] font-bold text-rio-ink font-mono">{product.locationCode}</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-rio-danger/10 text-rio-danger border-rio-danger/20">
                        Sin ubicación
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-rio-muted hidden md:table-cell">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-rio-ink">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    {product.lowStock ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-rio-warning/10 text-rio-warning border-rio-warning/20">
                        Pocas unidades
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-rio-success/10 text-rio-success border-rio-success/20">
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-bold">
                    <button onClick={() => setShowMockModal(true)} className="text-rio-gold-dark hover:text-rio-gold transition-colors">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mock Modal */}
      {showMockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-rio-surface rounded-2xl p-6 w-full max-w-md shadow-2xl border border-rio-border">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-serif font-bold text-rio-ink">Formulario de Producto</h3>
              <button onClick={() => setShowMockModal(false)} className="p-1 text-rio-muted hover:text-rio-ink transition-colors rounded-lg hover:bg-rio-surface-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[12px] text-rio-muted font-medium mb-5 bg-rio-surface-muted px-3 py-2 rounded-lg border border-rio-border">
              Vista previa del formulario. En producción, este formulario guardará datos reales.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Nombre del Producto</label>
                <input type="text" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background text-rio-ink" placeholder="Ej. Anillo Clásico" disabled />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Referencia (SKU)</label>
                  <input type="text" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background text-rio-ink" placeholder="ANI-001" disabled />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Ubicación Bodega</label>
                  <input type="text" className="w-full border border-rio-gold-light rounded-xl p-2.5 text-sm bg-rio-gold-light/10 text-rio-ink" placeholder="A-01-01" disabled />
                  <p className="text-[10px] text-rio-muted mt-1 font-medium">Clave para orden de preparación.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowMockModal(false)} className="flex-1 py-2.5 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">Cancelar</button>
              <button onClick={() => setShowMockModal(false)} className="flex-1 py-2.5 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors">Guardar (Simulado)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
