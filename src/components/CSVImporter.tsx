'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import { bulkUploadInventory } from '@/app/actions/inventory';
import { useRouter } from 'next/navigation';

export default function CSVImporter({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [previewCount, setPreviewCount] = useState(0);
  const [nuevosProductos, setNuevosProductos] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
      
      // Quick count preview
      Papa.parse(e.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewCount(results.data.length);
        }
      });
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setStatus('parsing');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          
          if (rows.length === 0) {
            setStatus('error');
            setMessage('El archivo CSV está vacío o no tiene el formato correcto.');
            return;
          }

          // Basic validation: Check if 'sku' column exists (case-insensitive check could be added)
          const firstRow: any = rows[0];
          if (!firstRow.hasOwnProperty('sku') && !firstRow.hasOwnProperty('SKU')) {
             setStatus('error');
             setMessage('Error: El archivo debe contener una columna llamada "sku".');
             return;
          }

          setStatus('uploading');
          
          // Mapear los datos para asegurar que los nombres de columnas cuadren
          // Se asume que el CSV tiene: sku, name, category, price, stock, locationCode
          const mappedItems = rows.map((row: any) => ({
            sku: row.sku || row.SKU,
            name: row.name || row.Nombre || row.nombre,
            category: row.category || row.Categoría || row.categoria || 'General',
            price: row.price || row.Precio || row.precio || 0,
            physicalStock: row.stock || row.Stock || row.cantidad || row.Cantidad || 0,
            locationCode: row.locationCode || row.Ubicación || row.ubicacion || null,
          }));

          const response = await bulkUploadInventory(mappedItems);
          
          if (response.success) {
            setStatus('success');
            setMessage(response.message);
            if (response.newProducts && response.newProducts.length > 0) {
              setNuevosProductos(response.newProducts);
            }
          } else {
            setStatus('error');
            setMessage(response.message);
          }
        } catch (err) {
          setStatus('error');
          setMessage('Ocurrió un error inesperado al procesar el archivo.');
        }
      },
      error: (error) => {
        setStatus('error');
        setMessage(`Error al leer el CSV: ${error.message}`);
      }
    });
  };

  const closeModal = () => {
    if (status === 'success' && onComplete) {
      onComplete();
    }
    setIsOpen(false);
    setFile(null);
    setStatus('idle');
    setMessage('');
    setPreviewCount(0);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2.5 border border-transparent text-[13px] font-semibold rounded-xl text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
      >
        <Upload className="w-4 h-4 mr-2" />
        Importar CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted">
              <h3 className="font-bold text-rio-ink flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-rio-gold-dark" />
                Actualización Masiva (CSV)
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-rio-border rounded-full text-rio-muted hover:text-rio-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-rio-background border border-rio-border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center">
                <Upload className="w-8 h-8 text-rio-muted mb-2" />
                <p className="text-sm font-bold text-rio-ink mb-1">Selecciona o arrastra tu archivo</p>
                <p className="text-xs text-rio-muted mb-4">Solo archivos .csv</p>
                
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-rio-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rio-gold-light/20 file:text-rio-gold-dark hover:file:bg-rio-gold-light/30 cursor-pointer"
                />
              </div>

              {file && status === 'idle' && (
                <div className="bg-rio-surface-muted p-3 rounded-lg border border-rio-border flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-rio-ink truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-rio-muted">{(file.size / 1024).toFixed(1)} KB • {previewCount} filas detectadas</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-rio-success" />
                </div>
              )}

              {status === 'parsing' && (
                <p className="text-sm font-bold text-rio-gold-dark text-center animate-pulse">Analizando archivo...</p>
              )}
              {status === 'uploading' && (
                <p className="text-sm font-bold text-rio-ink text-center animate-pulse">Guardando en base de datos...</p>
              )}
              
              {status === 'error' && (
                <div className="bg-rio-danger/10 p-3 rounded-lg border border-rio-danger/20 flex items-start gap-2 text-rio-danger">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">{message}</p>
                </div>
              )}

              {status === 'success' && (
                <div className="bg-rio-success/10 p-3 rounded-lg border border-rio-success/20 flex items-start gap-2 text-rio-success">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">{message}</p>
                </div>
              )}

              <div className="pt-2">
              {status === 'success' ? (
                  <div className="flex flex-col gap-2">
                    {nuevosProductos.length > 0 && (
                      <button 
                        onClick={() => {
                          const skus = nuevosProductos.map(p => p.sku);
                          localStorage.setItem('rio_new_skus_to_print', JSON.stringify(skus));
                          closeModal();
                          router.push('/admin/inventario/imprimir?new_only=true');
                        }}
                        className="w-full bg-rio-ink text-white font-bold py-3 rounded-xl shadow-md hover:bg-rio-ink/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Printer className="w-5 h-5" />
                        Imprimir Etiquetas Nuevas ({nuevosProductos.length})
                      </button>
                    )}
                    <button onClick={closeModal} className="w-full bg-rio-surface text-rio-ink border border-rio-border font-bold py-3 rounded-xl hover:bg-rio-surface-muted transition-colors">
                      Cerrar y ver inventario
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleUpload} 
                    disabled={!file || status === 'parsing' || status === 'uploading'}
                    className="w-full bg-rio-gold-dark text-white font-bold py-3 rounded-xl shadow-md hover:bg-rio-gold active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'uploading' ? 'Procesando...' : 'Iniciar Sincronización'}
                  </button>
                )}
              </div>

              <div className="mt-2 text-[10px] text-rio-muted leading-tight text-center">
                Las columnas esperadas son: <strong className="font-mono">sku, name, category, price, stock</strong>. 
                <br />Todo el procesamiento se hace localmente para burlar límites de servidor.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
