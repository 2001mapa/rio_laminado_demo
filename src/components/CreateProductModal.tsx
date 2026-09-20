'use client';

import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createSingleProduct } from '@/app/actions/inventory';
import { uploadProductPhoto } from '@/app/actions/photos';
import { compressImage } from '@/lib/imageCompression';

export default function CreateProductModal({ 
  isOpen, 
  onClose,
  onComplete
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onComplete: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Fotos locales
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [hoverPhoto, setHoverPhoto] = useState<File | null>(null);
  
  const mainPhotoRef = useRef<HTMLInputElement>(null);
  const hoverPhotoRef = useRef<HTMLInputElement>(null);

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
      price: parseFloat(formData.get('price') as string),
      physicalStock: parseInt(formData.get('physicalStock') as string, 10),
      reservedStock: 0,
      isActive: true,
      locationCode: formData.get('locationCode') as string || undefined,
    };

    try {
      // 1. Crear producto base
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const createRes = await createSingleProduct(productData, session?.access_token);
      
      if (!createRes.success) {
        setError(createRes.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Subir fotos si las hay
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
          <h3 className="text-lg font-serif font-bold text-rio-ink">Crear Nuevo Producto</h3>
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

          {/* Fotos Section */}
          <div>
            <h4 className="text-xs uppercase font-bold text-rio-muted tracking-wider mb-3">Fotografías</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Foto Principal */}
              <div 
                onClick={() => mainPhotoRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-32 ${mainPhoto ? 'border-rio-gold bg-rio-gold-light/10' : 'border-rio-border hover:border-rio-gold'}`}
              >
                <ImageIcon className={`w-6 h-6 mb-2 ${mainPhoto ? 'text-rio-gold-dark' : 'text-rio-muted'}`} />
                <p className="text-xs font-bold text-rio-ink mb-1">Foto Principal</p>
                <p className="text-[10px] text-rio-muted truncate w-full px-2">
                  {mainPhoto ? mainPhoto.name : 'Artículo (Fondo Blanco)'}
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={mainPhotoRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setMainPhoto(e.target.files[0]);
                  }}
                />
              </div>

              {/* Foto Hover */}
              <div 
                onClick={() => hoverPhotoRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-32 ${hoverPhoto ? 'border-rio-gold bg-rio-gold-light/10' : 'border-rio-border hover:border-rio-gold'}`}
              >
                <ImageIcon className={`w-6 h-6 mb-2 ${hoverPhoto ? 'text-rio-gold-dark' : 'text-rio-muted'}`} />
                <p className="text-xs font-bold text-rio-ink mb-1">Foto de Uso</p>
                <p className="text-[10px] text-rio-muted truncate w-full px-2">
                  {hoverPhoto ? hoverPhoto.name : 'Modelo (Opcional)'}
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={hoverPhotoRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setHoverPhoto(e.target.files[0]);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs uppercase font-bold text-rio-muted tracking-wider mb-2">Información del Artículo</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Referencia (SKU) *</label>
                <input name="sku" required type="text" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="Ej. ANI-001" />
              </div>
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Nombre *</label>
                <input name="name" required type="text" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="Ej. Anillo Clásico" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Categoría *</label>
                <select name="category" required className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold">
                  <option value="">Seleccionar...</option>
                  <option value="Anillos">Anillos</option>
                  <option value="Cadenas">Cadenas</option>
                  <option value="Pulseras">Pulseras</option>
                  <option value="Aretes">Aretes</option>
                  <option value="Dijes">Dijes</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Precio (COP) *</label>
                <input name="price" required type="number" min="0" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="50000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-rio-ink mb-1.5 uppercase tracking-wider">Stock Físico</label>
                <input name="physicalStock" required type="number" min="0" defaultValue="0" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" />
              </div>
              <div>
                <label className="block text-[11px] uppercase font-bold text-rio-muted tracking-wider mb-1.5">Ubicación (Opcional)</label>
                <input name="locationCode" type="text" className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold" placeholder="A-01" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t border-rio-border">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors flex justify-center items-center">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
