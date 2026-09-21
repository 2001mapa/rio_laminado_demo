'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { uploadProductPhoto } from '@/app/actions/photos';
import { compressImage } from '@/lib/imageCompression';

export default function BulkPhotoUploader({ onComplete }: { onComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ total: number; current: number; success: number; failed: number }>({
    total: 0, current: 0, success: 0, failed: 0
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setProgress({ total: files.length, current: 0, success: 0, failed: 0 });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        setProgress(p => ({ ...p, current: i + 1 }));
        
        // 1. Extraer SKU y Tipo (1 o 2)
        // Ej: "ANI-001_1.jpg" -> sku: "ANI-001", type: "1"
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const parts = nameWithoutExt.split('_');
        
        if (parts.length < 2) {
          throw new Error('Formato inválido. Use SKU_1 o SKU_2');
        }

        const type = parts.pop() as string;
        const sku = parts.join('_');

        if (type !== '1' && type !== '2') {
          throw new Error('El sufijo debe ser _1 o _2');
        }

        // 2. Comprimir en el navegador antes de enviar
        const compressedFile = await compressImage(file);

        // 3. Enviar al Server Action (Que simula guardar en Supabase)
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('sku', sku);
        formData.append('type', type);

        const response = await uploadProductPhoto(formData);

        if (response.success) {
          setProgress(p => ({ ...p, success: p.success + 1 }));
        } else {
          console.error(`Error uploading ${file.name}:`, response.message);
          setProgress(p => ({ ...p, failed: p.failed + 1 }));
        }

      } catch (err: any) {
        console.error(`Exception uploading ${file.name}:`, err.message);
        setProgress(p => ({ ...p, failed: p.failed + 1 }));
      }
    }

    setIsUploading(false);
    if (onComplete) onComplete();
  };

  const reset = () => {
    setFiles([]);
    setProgress({ total: 0, current: 0, success: 0, failed: 0 });
    setIsUploading(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2.5 border border-transparent text-[13px] font-semibold rounded-xl text-rio-ink bg-rio-gold-light/30 hover:bg-rio-gold-light/50 transition-colors"
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        Subir Fotos
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted shrink-0">
              <h3 className="font-bold text-rio-ink flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-rio-gold-dark" />
                Subidor Masivo de Fotos
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-rio-border rounded-full text-rio-muted hover:text-rio-ink" disabled={isUploading}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {!isUploading && progress.total === 0 && (
                <>
                  <div className="bg-rio-gold-light/10 border border-rio-gold-light rounded-xl p-4 text-xs text-rio-ink mb-4 leading-relaxed">
                    <p className="font-bold mb-1">Regla de nombres (Nomenclatura por Sufijos):</p>
                    <ul className="list-disc pl-4 text-rio-muted space-y-1">
                      <li>Foto Principal: <strong className="text-rio-ink font-mono">SKU_1.jpg</strong> (Ej: ANI-001_1.jpg)</li>
                      <li>Foto Secundaria: <strong className="text-rio-ink font-mono">SKU_2.jpg</strong> (Ej: ANI-001_2.jpg)</li>
                    </ul>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-rio-background border-2 border-rio-border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-rio-gold transition-colors"
                  >
                    <Upload className="w-8 h-8 text-rio-muted mb-2" />
                    <p className="text-sm font-bold text-rio-ink mb-1">Haz clic para seleccionar fotos</p>
                    <p className="text-xs text-rio-muted">Puedes seleccionar decenas a la vez</p>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFilesSelect}
                      className="hidden"
                    />
                  </div>
                </>
              )}

              {files.length > 0 && !isUploading && progress.total === 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-rio-ink">{files.length} fotos seleccionadas</span>
                    <button onClick={reset} className="text-xs text-rio-danger font-bold hover:underline">Limpiar</button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-1">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative group bg-rio-surface rounded-lg border border-rio-border p-2 flex flex-col items-center">
                        <ImageIcon className="w-8 h-8 text-rio-muted mb-1" />
                        <p className="text-[10px] text-rio-ink font-mono text-center break-all line-clamp-2" title={file.name}>
                          {file.name}
                        </p>
                        <button onClick={() => removeFile(idx)} className="absolute -top-2 -right-2 bg-rio-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-rio-gold-dark animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-rio-ink mb-1">Procesando {progress.current} de {progress.total}...</p>
                    <p className="text-xs text-rio-muted">Comprimiendo y guardando en base de datos</p>
                  </div>
                  
                  <div className="w-full bg-rio-surface-muted rounded-full h-3 border border-rio-border overflow-hidden">
                    <div 
                      className="bg-rio-gold-dark h-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>

                  <div className="flex gap-4 text-xs font-bold w-full justify-center mt-2">
                    <span className="text-rio-success flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> {progress.success} Ok</span>
                    <span className="text-rio-danger flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> {progress.failed} Error</span>
                  </div>
                </div>
              )}

              {progress.total > 0 && !isUploading && (
                <div className="py-6 flex flex-col items-center text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-rio-success" />
                  <h4 className="font-bold text-rio-ink text-lg">¡Proceso Terminado!</h4>
                  <p className="text-sm text-rio-muted">
                    Se subieron <strong className="text-rio-success">{progress.success}</strong> fotos correctamente.<br/>
                    <strong className="text-rio-danger">{progress.failed}</strong> fotos fallaron.
                  </p>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-rio-border bg-rio-surface-muted shrink-0">
              {progress.total > 0 && !isUploading ? (
                <button onClick={closeModal} className="w-full bg-rio-ink text-white font-bold py-3 rounded-xl hover:bg-rio-ink/90 transition-colors">
                  Cerrar
                </button>
              ) : (
                <button 
                  onClick={startUpload} 
                  disabled={files.length === 0 || isUploading}
                  className="w-full bg-rio-gold-dark text-white font-bold py-3 rounded-xl shadow-md hover:bg-rio-gold active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Subiendo...' : 'Iniciar Vinculación Mágica'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
