'use client';

import { useDemo } from '@/lib/DemoContext';
import { Plus, Info, X, Printer, Database } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';
import CSVImporter from '@/components/CSVImporter';
import BulkPhotoUploader from '@/components/BulkPhotoUploader';
import CreateProductModal from '@/components/CreateProductModal';

export default function InventarioPage() {
  const { products, refreshData } = useDemo();
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
      {/* DB notice */}
      <div className="flex items-start gap-3 bg-rio-ink/5 border border-rio-ink/10 rounded-xl px-4 py-3.5">
        <Database className="h-4 w-4 text-rio-ink shrink-0 mt-0.5" />
        <p className="text-[12px] text-rio-ink font-medium leading-snug">
          Integración activada. El botón de <strong>Importar CSV</strong> y <strong>Subir Fotos</strong> ahora procesarán los datos localmente y actualizarán la base de datos de manera real.
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
          <a
            href="/admin/inventario/imprimir"
            className="flex items-center px-4 py-2.5 border border-rio-gold text-[13px] font-semibold rounded-xl text-rio-gold-dark bg-rio-gold-light/10 hover:bg-rio-gold-light/20 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Etiquetas
          </a>
          <BulkPhotoUploader onComplete={() => refreshData()} />
          <CSVImporter onComplete={() => refreshData()} />
          <button
            onClick={() => setShowMockModal(true)}
            className="flex items-center px-4 py-2.5 border border-rio-border text-[13px] font-semibold rounded-xl text-rio-ink bg-white hover:bg-rio-surface-muted transition-colors shadow-sm"
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
                        <img src={product.imageUrl || undefined} alt="" className="h-full w-full object-cover mix-blend-multiply" />
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
                    {(product.physicalStock - product.reservedStock >= 1 && product.physicalStock - product.reservedStock <= 5) ? (
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

      {/* New Product Modal */}
      <CreateProductModal 
        isOpen={showMockModal} 
        onClose={() => setShowMockModal(false)} 
        onComplete={() => {
          setShowMockModal(false);
          refreshData();
        }}
      />
    </div>
  );
}
