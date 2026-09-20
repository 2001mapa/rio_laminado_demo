'use client';

import { useDemo } from '@/lib/DemoContext';
import { ArrowLeft, CheckSquare, Printer, ClipboardCheck, PackageCheck, AlertTriangle, Edit2, X } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

export default function PedidoDetalleAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, customers, products, updateOrderStatus, updateOrder } = useDemo();
  const router = useRouter();

  const [adjustingItem, setAdjustingItem] = useState<string | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [printingSingle, setPrintingSingle] = useState<string | null>(null);

  const order = orders.find(o => o.id === resolvedParams.id);

  if (!order) return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;

  const customer = customers.find(c => c.id === order.customerId);
  const hasIssues = order.items.some(i => i.issue);

  const sortedItems = [...order.items].sort((a, b) => {
    const pA = products.find(p => p.id === a.productId);
    const pB = products.find(p => p.id === b.productId);
    const catA = pA?.category || '';
    const catB = pB?.category || '';
    
    // Ordenamiento primario: por categoría (tipo de prenda)
    if (catA !== catB) return catA.localeCompare(catB);
    
    // Ordenamiento secundario: por ubicación en bodega
    const locA = pA?.locationCode || '';
    const locB = pB?.locationCode || '';
    if (!locA && locB) return 1; // Sin ubicación al final
    if (locA && !locB) return -1;
    return locA.localeCompare(locB);
  });

  const handleSaveAdjustment = () => {
    if (!order || !adjustingItem) return;
    const updatedItems = order.items.map(i => {
      if (i.id === adjustingItem) {
        return {
          ...i,
          originalQuantity: i.originalQuantity || i.quantity,
          quantity: adjustQuantity,
          adjustmentReason: adjustReason
        };
      }
      return i;
    });
    updateOrder({ ...order, items: updatedItems });
    setAdjustingItem(null);
  };

  const [offsetX, setOffsetX] = useState<number>(3.2);
  const [offsetY, setOffsetY] = useState<number>(1.6);
  const [gapY, setGapY] = useState<number>(3.0);
  const [gapX, setGapX] = useState<number>(3.0);

  return (
    <>
      {/* Screen Layout - Hidden on Print */}
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20 font-sans print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-rio-surface-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-rio-ink" />
            </button>
            <h1 className="text-2xl font-serif font-bold text-rio-ink">Pedido {order.number}</h1>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 md:flex-none flex justify-center items-center px-4 py-2 border border-rio-gold-light bg-rio-gold-light/10 shadow-sm text-sm font-bold rounded-xl text-rio-gold-dark hover:bg-rio-gold-light/20 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Etiquetas
            </button>
            <Link 
              href={`/admin/pedidos/${order.id}/imprimir`}
              className="flex-1 md:flex-none flex justify-center items-center px-4 py-2 border border-rio-border shadow-sm text-sm font-semibold rounded-xl text-rio-ink bg-rio-surface hover:bg-rio-surface-muted transition-colors"
            >
              <ClipboardCheck className="w-4 h-4 mr-2 text-rio-muted" />
              Hoja de Bodega
            </Link>
          </div>
        </div>

        {/* Calibracion UI */}
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
            <strong>Tip:</strong> Si ves que cada fila se imprime un poquito más arriba que la anterior, aumenta la distancia entre filas (+). Y OJO: En las opciones de impresión pon <strong>Escala: Personalizado 100%</strong> y márgenes en NINGUNO.
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Order Details */}
            <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
              <div className="flex justify-between items-center mb-5 border-b border-rio-border pb-4">
                <h2 className="text-lg font-bold text-rio-ink">Detalle de Referencias</h2>
                <span className="text-[10px] font-bold text-rio-ink bg-rio-surface-muted border border-rio-border px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Ordenado por bodega
                </span>
              </div>
              <div className="space-y-4">
                {sortedItems.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex gap-4 border-b border-rio-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="w-16 h-16 rounded-xl bg-rio-surface-muted shrink-0 overflow-hidden border border-rio-border">
                        <img src={product.imageUrl || undefined} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          {product.locationCode ? (
                            <span className="text-[10px] font-bold bg-rio-ink text-white px-2 py-0.5 rounded uppercase tracking-wider">
                              UBIC: {product.locationCode}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-rio-danger/10 text-rio-danger border border-rio-danger/20 px-2 py-0.5 rounded uppercase tracking-wider">
                              SIN UBICACIÓN
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            {item.originalQuantity !== undefined && item.originalQuantity !== item.quantity && (
                              <span className="text-[10px] line-through text-rio-muted">Cant: {item.originalQuantity}</span>
                            )}
                            <span className="text-sm font-bold text-rio-ink bg-rio-background px-2 py-0.5 rounded border border-rio-border">Cant: {item.quantity}</span>
                            <button 
                              onClick={() => {
                                setAdjustingItem(item.id);
                                setAdjustQuantity(item.quantity);
                                setAdjustReason(item.adjustmentReason || 'Control de Calidad');
                              }}
                              className="p-1 text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setPrintingSingle(item.id);
                                setTimeout(() => {
                                  window.print();
                                  setTimeout(() => setPrintingSingle(null), 500);
                                }, 100);
                              }}
                              className="p-1 text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted rounded-md transition-colors"
                              title="Reimprimir sticker"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-mono font-bold text-rio-muted">{product.sku}</span>
                          {item.verified && !item.issue && (
                            <span className="text-[10px] font-bold text-rio-success flex items-center bg-rio-success/10 border border-rio-success/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              <CheckSquare className="w-3 h-3 mr-1" /> Verificado
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-rio-ink leading-snug">{product.name}</p>
                        {item.issue && (
                          <div className="mt-2 text-[11px] font-medium text-rio-danger bg-rio-danger/5 p-2 rounded-lg border border-rio-danger/20 flex items-start">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                            <span>{item.issue}</span>
                          </div>
                        )}
                        {item.adjustmentReason && (
                          <div className="mt-2 text-[11px] font-medium text-rio-warning bg-rio-warning/5 p-2 rounded-lg border border-rio-warning/20 flex items-start">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                            <span>Ajustado: {item.adjustmentReason} (Original: {item.originalQuantity})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
              <h3 className="text-sm font-bold text-rio-ink uppercase tracking-wider mb-4">Cliente Mayorista</h3>
              <div className="space-y-2 text-sm font-medium">
                <p className="text-rio-ink font-bold text-base">{customer?.name}</p>
                <p className="text-rio-muted">{customer?.email}</p>
                <p className="text-rio-muted">{customer?.phone}</p>
                <p className="text-rio-muted leading-snug">{customer?.address}</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
              <h3 className="text-sm font-bold text-rio-ink uppercase tracking-wider mb-4">Estado del Pedido</h3>
              
              <div className={`mb-6 p-4 rounded-xl border ${
                order.status === 'Reservado' ? 'bg-rio-gold-light/20 border-rio-gold-light/50' :
                order.status === 'Verificado' || order.status === 'Despachado' ? 'bg-rio-success/10 border-rio-success/20' :
                'bg-rio-surface-muted border-rio-border'
              }`}>
                <p className="text-sm font-bold text-rio-ink mb-1">Estado Actual</p>
                <p className={`text-lg font-serif font-bold ${
                  order.status === 'Reservado' ? 'text-rio-gold-dark' :
                  order.status === 'Verificado' || order.status === 'Despachado' ? 'text-rio-success' :
                  'text-rio-ink'
                }`}>{order.status}</p>
              </div>

              <div className="space-y-3">
                {order.status === 'Reservado' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'Confirmado')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
                  >
                    Confirmar Pedido
                  </button>
                )}
                
                {order.status === 'Confirmado' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'En preparación')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
                  >
                    Iniciar Preparación en Bodega
                  </button>
                )}

                {order.status === 'En preparación' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'Pendiente de verificación')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
                  >
                    Terminar Empaque
                  </button>
                )}

                {(order.status === 'Pendiente de verificación' || order.status === 'En preparación') && (
                  <Link 
                    href={`/admin/pedidos/${order.id}/verificar`}
                    className="w-full flex items-center justify-center px-4 py-3 border border-rio-border text-sm font-bold rounded-xl text-rio-ink bg-rio-background hover:bg-rio-surface-muted transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2 text-rio-muted" />
                    Ir al Checklist Digital
                  </Link>
                )}

                {order.status === 'Pendiente de verificación' && (
                  <button 
                    disabled={hasIssues}
                    onClick={() => {
                      if (hasIssues) alert('No se puede verificar porque hay incidencias reportadas en el checklist.');
                      else updateOrderStatus(order.id, 'Verificado');
                    }}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white transition-colors ${
                      hasIssues ? 'bg-rio-border cursor-not-allowed' : 'bg-rio-success hover:bg-rio-success/90'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Marcar como Verificado
                  </button>
                )}
                
                {order.status === 'Verificado' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'Despachado')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
                  >
                    Marcar como Despachado
                  </button>
                )}
              </div>
              
              {hasIssues && order.status === 'Pendiente de verificación' && (
                <p className="mt-3 text-[11px] text-rio-danger font-medium leading-relaxed">
                  Debes resolver las incidencias en el checklist antes de poder verificar el pedido.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ajuste de Cantidad */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-rio-ink text-lg">Ajustar Cantidad</h3>
              <button onClick={() => setAdjustingItem(null)} className="text-rio-muted hover:text-rio-ink"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-rio-muted uppercase tracking-wider mb-2">Cantidad a enviar</label>
                <input 
                  type="number" 
                  value={adjustQuantity} 
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  min={0}
                  className="w-full border border-rio-border rounded-xl p-3 text-lg font-bold bg-rio-background text-rio-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rio-muted uppercase tracking-wider mb-2">Motivo del ajuste</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-rio-border rounded-xl p-3 text-sm bg-rio-background text-rio-ink"
                >
                  <option value="Control de Calidad">Control de Calidad (Dañado)</option>
                  <option value="Falta de Inventario">Falta de Inventario</option>
                  <option value="Ajuste Administrativo">Ajuste Administrativo</option>
                </select>
              </div>
              <button
                onClick={handleSaveAdjustment}
                className="w-full bg-rio-ink text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rio-ink/90 active:scale-95 transition-all mt-2"
              >
                Guardar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Layout: Thermal Labels (Stickers) */}
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
        
        {(() => {
          const itemsToPrint = sortedItems.filter(item => printingSingle ? item.id === printingSingle : true);
          
          return (
            <div>
              <div 
                className="grid grid-cols-3"
                style={{ paddingLeft: `${offsetX}mm`, paddingTop: `${offsetY}mm`, rowGap: `${gapY}mm`, columnGap: `${gapX}mm` }}
              >
                {itemsToPrint.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div 
                      key={item.id} 
                      className="w-[32mm] h-[16mm] break-inside-avoid flex flex-col items-center justify-between text-black overflow-hidden p-[1mm]"
                    >
                      {/* Fila superior de texto */}
                      <div className="w-full flex justify-between items-center leading-none mb-[1.5mm]">
                        <span className="font-bold text-[9px]">#{index + 1}</span>
                        <span className="font-black text-[10px] tracking-tighter truncate mx-1">{product?.sku}</span>
                        <span className="font-bold text-[9px]">C:{item.quantity}</span>
                      </div>
                      
                      {/* Código de barras 1D */}
                      <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                        {product?.sku ? (
                          <img 
                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(product.sku)}&scaleX=2&scaleY=1&includetext=false`}
                            alt={product.sku}
                            className="w-full h-full object-contain mix-blend-multiply"
                            loading="eager"
                          />
                        ) : (
                          <span className="text-[8px] text-gray-400">Sin SKU</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
