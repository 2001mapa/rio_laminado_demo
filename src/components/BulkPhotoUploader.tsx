'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { uploadProductPhoto } from '@/app/actions/photos';
import { compressImage } from '@/lib/imageCompression';

export default function BulkPhotoUploader({ onComplete }: { onComplete?: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ total: number; current: number; success: number; failed: number; errors: {name: string, message: string}[] }>({
    total: 0, current: 0, success: 0, failed: 0, errors: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const newErrors: {name: string, message: string}[] = [];
      
      allFiles.forEach(f => {
        if (f.type.startsWith('image/')) {
           validFiles.push(f);
        } else {
           newErrors.push({ name: f.name, message: 'Rechazado: No es un archivo de imagen válido.' });
        }
      });
      
      setFiles(prev => [...prev, ...validFiles]);
      if (newErrors.length > 0) {
         setProgress(p => ({ ...p, errors: [...p.errors, ...newErrors] }));
      }
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    // Preserve existing "not image" errors in the list
    setProgress(p => ({ total: files.length, current: 0, success: 0, failed: 0, errors: p.errors }));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        setProgress(p => ({ ...p, current: i + 1 }));
        
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const parts = nameWithoutExt.split('_');
        
        if (parts.length < 2) {
          throw new Error('Formato inválido. El nombre debe terminar en _1 o _2');
        }

        const type = parts.pop() as string;
        const sku = parts.join('_');

        if (type !== '1' && type !== '2') {
          throw new Error('El sufijo final debe ser _1 o _2');
        }

        const compressedFile = await compressImage(file);

        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('sku', sku);
        formData.append('type', type);

        const response = await uploadProductPhoto(formData);

        if (response.success) {
          setProgress(p => ({ ...p, success: p.success + 1 }));
        } else {
          setProgress(p => ({ 
            ...p, 
            failed: p.failed + 1,
            errors: [...p.errors, { name: file.name, message: response.message || 'Error desconocido' }]
          }));
        }
      } catch (err: any) {
        setProgress(p => ({ 
          ...p, 
          failed: p.failed + 1,
          errors: [...p.errors, { name: file.name, message: err.message || 'Error de procesamiento' }]
        }));
      }
    }

    setIsUploading(false);
    if (onComplete) onComplete();
  };

  const reset = () => {
    setFiles([]);
    setProgress({ total: 0, current: 0, success: 0, failed: 0, errors: [] });
  };

  return (
    <div className="flex flex-col space-y-4">
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
              ref={fileInputRef}
              onChange={handleFilesSelect}
              className="hidden"
            />
          </div>
          
          {progress.errors.length > 0 && files.length === 0 && (
            <div className="w-full text-left bg-red-50 border border-red-100 rounded-lg p-3 max-h-40 overflow-y-auto mt-4">
              <p className="text-xs font-bold text-red-600 mb-2">Archivos rechazados:</p>
              <ul className="text-xs text-red-700 space-y-1 font-mono">
                {progress.errors.map((err, idx) => (
                  <li key={idx} className="border-b border-red-100/50 pb-1">
                    <strong>{err.name}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {files.length > 0 && !isUploading && progress.total === 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-rio-ink">{files.length} fotos seleccionadas</span>
            <button onClick={reset} className="text-xs text-rio-danger font-bold hover:underline">Limpiar</button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1">
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
          
          {progress.errors.length > 0 && (
            <div className="w-full text-left bg-red-50 border border-red-100 rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-xs font-bold text-red-600 mb-2">Archivos rechazados:</p>
              <ul className="text-xs text-red-700 space-y-1 font-mono">
                {progress.errors.map((err, idx) => (
                  <li key={idx} className="border-b border-red-100/50 pb-1">
                    <strong>{err.name}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isUploading && (
        <div className="py-8 flex flex-col items-center text-center space-y-4">
          <Loader2 className="w-10 h-10 text-rio-gold-dark animate-spin" />
          <div>
            <p className="text-sm font-bold text-rio-ink mb-1">Procesando {progress.current} de {progress.total}...</p>
            <p className="text-xs text-rio-muted">Comprimiendo y vinculando al inventario</p>
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
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-rio-success" />
          <h4 className="font-bold text-rio-ink text-lg">¡Proceso Terminado!</h4>
          <p className="text-sm text-rio-muted">
            Se vincularon <strong className="text-rio-success">{progress.success}</strong> fotos correctamente.<br/>
            <strong className="text-rio-danger">{progress.failed}</strong> fotos fallaron.
          </p>
          
          {progress.errors.length > 0 && (
            <div className="w-full text-left bg-red-50 border border-red-100 rounded-lg p-3 max-h-60 overflow-y-auto mt-4">
              <p className="text-xs font-bold text-red-600 mb-2">Detalle de errores:</p>
              <ul className="text-xs text-red-700 space-y-1 font-mono">
                {progress.errors.map((err, idx) => (
                  <li key={idx} className="border-b border-red-100/50 pb-1">
                    <strong>{err.name}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-rio-border mt-4">
        {progress.total > 0 && !isUploading ? (
          <button onClick={reset} className="w-full bg-rio-ink text-white font-bold py-3 rounded-xl hover:bg-rio-ink/90 transition-colors">
            Subir más fotos
          </button>
        ) : (
          <button 
            onClick={startUpload} 
            disabled={files.length === 0 || isUploading}
            className="w-full bg-rio-gold-dark text-white font-bold py-3 rounded-xl shadow-md hover:bg-rio-gold active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Subiendo...' : 'Iniciar Vinculación por SKU'}
          </button>
        )}
      </div>
    </div>
  );
}
