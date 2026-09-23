'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createSingleProduct, updateProductAction } from '@/app/actions/inventory';
import { uploadProductPhoto } from '@/app/actions/photos';
import { compressImage } from '@/lib/imageCompression';

export default function CreateProductModal({ 
  isOpen, 
  onClose,
  onComplete,
  initialData = null
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onComplete: () => void;
  initialData?: any;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Fotos locales
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [hoverPhoto, setHoverPhoto] = useState<File | null>(null);
  
  const mainPhotoRef = useRef<HTMLInputElement>(null);
  const hoverPhotoRef = useRef<HTMLInputElement>(null);
  
  const isEdit = !!initialData;
  const [enableSkuEdit, setEnableSkuEdit] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMainPhoto(null);
      setHoverPhoto(null);
      setError('');
      setEnableSkuEdit(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const sku = (formData.get('sku') as string).toUpperCase().trim();
    
    const productData = {
      sku,
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      material: formData.get('material') as string,
      price: parseFloat(formData.get('price') as string),
      physicalStock: parseInt(formData.get('physicalStock') as string, 10),
      locationCode: (formData.get('locationCode') as string || '').trim() || null,
      isActive: formData.get('isActive') === 'on'
    };

    try {
      if (isEdit) {
         if (initialData.material !== productData.material && initialData.reservedStock > 0) {
            if (!confirm(`Este producto está reservado en pedidos. ¿Seguro que deseas cambiar el material de ${initialData.material} a ${productData.material}?`)) {
               setIsSubmitting(false);
               return;
            }
         }
         const updateRes = await updateProductAction(initialData.id, productData);
         if (!updateRes.success) {
           setError(updateRes.message);
           setIsSubmitting(false);
           return;
         }
      } else {
        const createRes = await createSingleProduct({
          ...productData,
          locationCode: productData.locationCode || undefined
        });
        
        if (!createRes.success) {
          setError(createRes.message);
          setIsSubmitting(false);
          return;
        }
      }

      // Subir fotos si las hay
      if (mainPhoto) {
        const compressed = await compressImage(mainPhoto);
        const photoData = new FormData();
        photoData.append('file', compressed);
        photoData.append('sku', sku);
        photoData.append('type', '1');
        await uploadProductPhoto(photoData);
      }

      if (hoverPhoto) {
        const compressed = await compressImage(hoverPhoto);
        const photoData = new FormData();
        photoData.append('file', compressed);
        photoData.append('sku', sku);
        photoData.append('type', '2');
        await uploadProductPhoto(photoData);
      }

      setIsSubmitting(false);
      onComplete();
      
    } catch (err) {
      setError('Ocurrió un error inesperado.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-rio-surface rounded-2xl w-full max-w-2xl shadow-2xl border border-rio-border flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted shrink-0">
          <h3 className="text-lg font-serif font-bold text-rio-ink">{isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
          <button onClick={onClose} className="p-1 text-rio-muted hover:text-rio-ink transition-colors rounded-lg hover:bg-rio-border" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-3 bg-rio-danger/10 border border-rio-danger/20 text-rio-danger text-sm font-bold rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-rio-ink border-b border-rio-border pb-2">Información Básica</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5">SKU / Referencia</label>
                  <div className="relative">
                    <input name="sku" defaultValue={initialData?.sku || ''} required type="text" disabled={isEdit && !enableSkuEdit} className="w-full border border-rio-border rounded-lg p-2.5 text-sm font-mono bg-rio-background focus:border-rio-ink outline-none uppercase disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ej. A101" />
                    {isEdit && !enableSkuEdit && (
                      <button type="button" onClick={() => setEnableSkuEdit(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-rio-gold-dark font-bold hover:underline">
                        Editar
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5">Categoría</label>
                  <input name="category" defaultValue={initialData?.category || ''} required type="text" className="w-full border border-rio-border rounded-lg p-2.5 text-sm bg-rio-background focus:border-rio-ink outline-none" placeholder="Ej. Aretes" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5">Material</label>
                <select name="material" defaultValue={initialData?.material || 'Por revisar'} className="w-full border border-rio-border rounded-lg p-2.5 text-sm bg-rio-background focus:border-rio-ink outline-none">
                  <option value="Por revisar">Por revisar (Automático)</option>
                  <option value="Laminado">Laminado</option>
                  <option value="Plata">Plata</option>
                  <option value="Rodio">Rodio</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5">Nombre del Producto</label>
                <input name="name" defaultValue={initialData?.name || ''} required type="text" className="w-full border border-rio-border rounded-lg p-2.5 text-sm bg-rio-background focus:border-rio-ink outline-none" placeholder="Ej. Aretes de Plata" />
              </div>
              
              {isEdit && (
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActive" name="isActive" defaultChecked={initialData?.isActive ?? true} className="rounded border-rio-border text-rio-ink focus:ring-rio-gold" />
                    <label htmlFor="isActive" className="text-[13px] font-medium text-rio-ink">Producto Activo (visible)</label>
                 </div>
              )}
              {!isEdit && <input type="hidden" name="isActive" value="on" />}
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-rio-ink border-b border-rio-border pb-2">Inventario y Precio</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5 flex items-center">
                    Stock Físico
                    <span className="ml-2 px-1.5 py-0.5 bg-rio-surface-muted text-rio-muted text-[9px] rounded" title="El CSV sobreescribe esto">Sincronizable</span>
                  </label>
                  <input name="physicalStock" defaultValue={initialData?.physicalStock || 0} required type="number" min="0" className="w-full border border-rio-border rounded-lg p-2.5 text-sm bg-rio-background focus:border-rio-ink outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5 flex items-center">
                    Reservado
                    <span className="ml-2 px-1.5 py-0.5 bg-rio-warning/10 text-rio-warning text-[9px] rounded">Solo lectura</span>
                  </label>
                  <input value={initialData?.reservedStock || 0} disabled type="number" className="w-full border border-rio-border rounded-lg p-2.5 text-sm bg-rio-surface-muted outline-none text-rio-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5">Precio (COP)</label>
                  <input name="price" defaultValue={initialData?.price || ''} required type="number" min="0" step="100" className="w-full border border-rio-border rounded-lg p-2.5 text-sm font-mono bg-rio-background focus:border-rio-ink outline-none" placeholder="Ej. 15000" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rio-muted uppercase tracking-wider mb-1.5">Ubicación Bodega</label>
                  <input name="locationCode" defaultValue={initialData?.locationCode || ''} type="text" className="w-full border border-rio-border rounded-lg p-2.5 text-sm font-mono bg-rio-background focus:border-rio-ink outline-none" placeholder="Ej. E1-A" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-rio-border">
            <h4 className="font-bold text-rio-ink mb-4">Fotografías {isEdit && <span className="text-xs text-rio-muted font-normal ml-2">(Dejar vacío para conservar actuales)</span>}</h4>
            <div className="flex gap-4">
              <div 
                className="flex-1 border-2 border-dashed border-rio-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-rio-ink transition-colors relative overflow-hidden"
                onClick={() => mainPhotoRef.current?.click()}
              >
                <input type="file" ref={mainPhotoRef} onChange={(e) => setMainPhoto(e.target.files?.[0] || null)} className="hidden" accept="image/jpeg,image/png,image/webp" />
                {mainPhoto ? (
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 text-rio-ink mx-auto mb-2" />
                    <p className="text-xs font-medium text-rio-ink truncate max-w-[150px]">{mainPhoto.name}</p>
                  </div>
                ) : initialData?.imageUrl ? (
                  <img src={initialData.imageUrl} alt="Actual 1" className="absolute inset-0 w-full h-full object-contain opacity-40" />
                ) : null}
                {!mainPhoto && (
                  <div className="text-center relative z-10 bg-white/80 p-2 rounded">
                    <p className="text-xs font-bold text-rio-muted mb-1">Foto Principal (Frontal)</p>
                    <p className="text-[10px] text-rio-muted/70">Clic para cambiar</p>
                  </div>
                )}
              </div>

              <div 
                className="flex-1 border-2 border-dashed border-rio-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-rio-ink transition-colors relative overflow-hidden"
                onClick={() => hoverPhotoRef.current?.click()}
              >
                <input type="file" ref={hoverPhotoRef} onChange={(e) => setHoverPhoto(e.target.files?.[0] || null)} className="hidden" accept="image/jpeg,image/png,image/webp" />
                {hoverPhoto ? (
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 text-rio-ink mx-auto mb-2" />
                    <p className="text-xs font-medium text-rio-ink truncate max-w-[150px]">{hoverPhoto.name}</p>
                  </div>
                ) : initialData?.hoverImageUrl ? (
                  <img src={initialData.hoverImageUrl} alt="Actual 2" className="absolute inset-0 w-full h-full object-contain opacity-40" />
                ) : null}
                {!hoverPhoto && (
                  <div className="text-center relative z-10 bg-white/80 p-2 rounded">
                    <p className="text-xs font-bold text-rio-muted mb-1">Foto Hover (Puesta/Opcional)</p>
                    <p className="text-[10px] text-rio-muted/70">Clic para cambiar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-rio-border flex justify-end gap-3 sticky bottom-0 bg-rio-surface pb-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-rio-muted hover:bg-rio-surface-muted rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center px-6 py-2.5 bg-rio-ink text-white text-sm font-bold rounded-xl shadow-lg hover:bg-rio-ink/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                isEdit ? 'Actualizar Producto' : 'Crear Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
