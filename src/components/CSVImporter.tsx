'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertTriangle, Printer, ArrowRight } from 'lucide-react';
import { bulkUploadInventory, previewCSVUpload } from '@/app/actions/inventory';
import { useRouter } from 'next/navigation';

export default function CSVImporter({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'staging' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [previewData, setPreviewData] = useState<{ toCreate: number, toUpdate: number, errors: any[] } | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [nuevosProductos, setNuevosProductos] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('parsing');
      setMessage('');
      setPreviewData(null);
      
      Papa.parse(e.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data;
            if (rows.length === 0) {
              setStatus('error');
              setMessage('El archivo CSV está vacío.');
              return;
            }

            const mappedItems = rows.map((row: any) => ({
              sku: row.sku || row.SKU,
              name: row.name || row.Nombre || row.nombre,
              category: row.category || row.Categoría || row.categoria || 'General',
              price: row.price || row.Precio || row.precio || 0,
              physicalStock: row.stock || row.Stock || row.cantidad || row.Cantidad || 0,
              locationCode: row.locationCode || row.Ubicación || row.ubicacion || null,
            }));

            setParsedItems(mappedItems);
            
            // Call server for staging validation
            const previewResponse = await previewCSVUpload(mappedItems);
            
            if (previewResponse.success) {
              setPreviewData({
                toCreate: previewResponse.toCreate || 0,
                toUpdate: previewResponse.toUpdate || 0,
                errors: previewResponse.errors || []
              });
              setStatus('staging');
            } else {
              setStatus('error');
              setMessage(previewResponse.error || 'Error al validar el archivo.');
            }
          } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(err.message || 'Ocurrió un error inesperado al leer el archivo.');
          }
        },
        error: (error) => {
          setStatus('error');
          setMessage(`Error al leer el CSV: ${error.message}`);
        }
      });
    }
  };

  const handleConfirmUpload = async () => {
    setStatus('uploading');
    
    try {
      const response = await bulkUploadInventory(parsedItems);
      
      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Importación exitosa.');
        if (response.newProducts && response.newProducts.length > 0) {
          setNuevosProductos(response.newProducts);
        }
      } else {
        setStatus('error');
        setMessage(response.message || 'Error en la importación.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Ocurrió un error inesperado al procesar el archivo.');
    }
  };

  const closeModal = () => {
    if (status === 'success' && onComplete) {
      onComplete();
    }
    setIsOpen(false);
    setFile(null);
    setStatus('idle');
    setMessage('');
    setPreviewData(null);
    setParsedItems([]);
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted shrink-0">
              <h3 className="font-bold text-rio-ink flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-rio-gold-dark" />
                Sincronización de Inventario
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-rio-border rounded-full text-rio-muted hover:text-rio-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {status === 'idle' && (
                <div className="bg-rio-background border border-rio-border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <Upload className="w-8 h-8 text-rio-muted mb-2" />
                  <p className="text-sm font-bold text-rio-ink mb-1">Selecciona o arrastra tu archivo CSV</p>
                  <p className="text-xs text-rio-muted mb-4">El archivo será pre-validado antes de aplicar cambios</p>
                  
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-rio-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rio-gold-light/20 file:text-rio-gold-dark hover:file:bg-rio-gold-light/30 cursor-pointer"
                  />
                </div>
              )}

              {status === 'parsing' && (
                <div className="py-10 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-rio-gold/30 border-t-rio-gold rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-bold text-rio-ink">Analizando y validando archivo...</p>
                </div>
              )}

              {status === 'staging' && previewData && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-rio-surface-muted p-4 rounded-xl border border-rio-border space-y-3">
                    <h4 className="font-bold text-rio-ink text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-rio-success" />
                      Resumen de Validación
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-rio-border">
                        <span className="text-2xl font-black text-rio-ink">{previewData.toCreate}</span>
                        <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider">Productos Nuevos</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-rio-border">
                        <span className="text-2xl font-black text-rio-ink">{previewData.toUpdate}</span>
                        <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider">SKUs Actualizados</p>
                      </div>
                    </div>
                    
                    {previewData.errors.length > 0 && (
                      <div className="mt-3 bg-rio-danger/10 border border-rio-danger/20 rounded-lg p-3">
                        <p className="text-xs font-bold text-rio-danger mb-2">Se detectaron {previewData.errors.length} errores:</p>
                        <ul className="text-[11px] text-rio-danger/80 space-y-1 max-h-24 overflow-y-auto pr-2">
                          {previewData.errors.map((e, idx) => (
                            <li key={idx}>Fila {e.row}: {e.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-rio-muted text-center leading-relaxed">
                    Los productos existentes mantendrán sus fotos y configuración. Solo se actualizará el stock físico y datos principales.
                  </p>
                </div>
              )}

              {status === 'uploading' && (
                <div className="py-10 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-rio-ink/30 border-t-rio-ink rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-bold text-rio-ink">Aplicando cambios en la base de datos...</p>
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-rio-danger/10 p-4 rounded-xl border border-rio-danger/20 flex flex-col items-center text-center gap-2 text-rio-danger">
                  <AlertTriangle className="w-8 h-8 mb-1" />
                  <p className="text-sm font-bold">{message}</p>
                  <button onClick={() => setStatus('idle')} className="mt-2 text-xs font-bold underline hover:no-underline">
                    Intentar con otro archivo
                  </button>
                </div>
              )}

              {status === 'success' && (
                <div className="bg-rio-success/10 p-6 rounded-xl border border-rio-success/20 flex flex-col items-center text-center gap-3">
                  <CheckCircle className="w-12 h-12 text-rio-success" />
                  <h4 className="font-bold text-rio-ink text-lg">Sincronización Exitosa</h4>
                  <p className="text-sm text-rio-ink/80">{message}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-rio-border bg-rio-background shrink-0">
              {status === 'staging' && (
                <div className="flex gap-3">
                  <button onClick={() => setStatus('idle')} className="flex-1 px-4 py-3 bg-white border border-rio-border text-rio-ink font-bold rounded-xl hover:bg-rio-surface-muted transition-colors">
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirmUpload} 
                    className="flex-1 px-4 py-3 bg-rio-gold-dark text-white font-bold rounded-xl hover:bg-rio-gold shadow-md active:scale-95 transition-all flex justify-center items-center gap-2"
                  >
                    Confirmar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col gap-3">
                  {nuevosProductos.length > 0 && (
                    <button 
                      onClick={() => {
                        const skus = nuevosProductos.map(p => p.sku);
                        localStorage.setItem('rio_new_skus_to_print', JSON.stringify(skus));
                        closeModal();
                        router.push('/admin/inventario/imprimir?new_only=true');
                      }}
                      className="w-full bg-rio-ink text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-rio-ink/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Imprimir Etiquetas Nuevas ({nuevosProductos.length})
                    </button>
                  )}
                  <button onClick={closeModal} className="w-full bg-white text-rio-ink border border-rio-border font-bold py-3.5 rounded-xl hover:bg-rio-surface-muted transition-colors">
                    Cerrar y ver inventario
                  </button>
                </div>
              )}

              {(status === 'idle' || status === 'parsing' || status === 'uploading' || status === 'error') && (
                <div className="text-[10px] text-rio-muted leading-relaxed text-center">
                  Columnas esperadas: <strong className="font-mono bg-rio-surface px-1 py-0.5 rounded">sku, name, category, price, stock</strong>. 
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
