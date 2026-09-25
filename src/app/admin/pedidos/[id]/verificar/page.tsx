'use client';

import { useDemo } from '@/lib/DemoContext';
import { ArrowLeft, Check, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, products, updateOrder } = useDemo();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [issueInputs, setIssueInputs] = useState<Record<string, string>>({});

  const order = orders.find(o => o.id === resolvedParams.id);

  if (!order) return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;

  const handleVerify = (itemId: string, status: 'ok' | 'issue', issueMsg?: string) => {
    const newItems = order.items.map(i => {
      if (i.id === itemId) {
        if (status === 'ok') {
          return { ...i, verified: true, issue: undefined };
        } else {
          return { ...i, verified: true, issue: issueMsg || 'Incidencia no especificada' };
        }
      }
      return i;
    });
    updateOrder({ ...order, items: newItems });
  };

  const sortedOrderItems = [...order.items].sort((a, b) => {
    const pA = products.find(p => p.id === a.productId);
    const pB = products.find(p => p.id === b.productId);
    const locA = pA?.locationCode || '';
    const locB = pB?.locationCode || '';
    if (!locA && locB) return -1;
    if (locA && !locB) return 1;
    return locA.localeCompare(locB);
  });

  const pendingItems = sortedOrderItems.filter(i => !i.verified && !i.issue);
  const verifiedItems = sortedOrderItems.filter(i => i.verified || i.issue);

  const totalLines = order.items.length;
  const verifiedLines = order.items.filter(i => i.verified).length;
  const issueLines = order.items.filter(i => i.issue).length;
  const okLines = verifiedLines - issueLines;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-20 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-rio-surface-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-rio-ink" />
          </button>
          <div>
            <h1 className="text-xl font-serif font-bold text-rio-ink">Checklist de Bodega</h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rio-muted">Pedido {order.number}</p>
          </div>
        </div>
      </div>

      <div className="bg-rio-surface p-5 rounded-2xl border border-rio-border shadow-sm">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-rio-ink">Progreso de Verificación</span>
          <span className="text-sm font-bold text-rio-ink bg-rio-background px-2 py-0.5 rounded-md border border-rio-border">{verifiedLines} de {totalLines}</span>
        </div>
        <div className="w-full bg-rio-surface-muted rounded-full h-3 mb-4 overflow-hidden border border-rio-border">
          <div 
            className="bg-rio-success h-3 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${(verifiedLines / totalLines) * 100}%` }}
          ></div>
        </div>
        <div className="flex gap-4 text-[11px] font-bold uppercase tracking-wider">
          <span className="text-rio-success flex items-center bg-rio-success/10 px-2 py-0.5 rounded border border-rio-success/20">
            <Check className="w-3 h-3 mr-1" /> {okLines} Correctos
          </span>
          <span className="text-rio-danger flex items-center bg-rio-danger/10 px-2 py-0.5 rounded border border-rio-danger/20">
            <AlertTriangle className="w-3 h-3 mr-1" /> {issueLines} Con Incidencias
          </span>
        </div>
      </div>

      <div className="flex border-b border-rio-border">
        <button
          className={`px-6 py-3 font-bold text-sm ${activeTab === 'pending' ? 'border-b-2 border-rio-gold text-rio-gold-dark' : 'text-rio-muted hover:text-rio-ink'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendientes ({pendingItems.length})
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm ${activeTab === 'verified' ? 'border-b-2 border-rio-gold text-rio-gold-dark' : 'text-rio-muted hover:text-rio-ink'}`}
          onClick={() => setActiveTab('verified')}
        >
          Revisados ({verifiedItems.length})
        </button>
      </div>

      <div className="space-y-4">
        {(activeTab === 'pending' ? pendingItems : verifiedItems).map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) return null;

          return (
            <div key={item.id} className={`bg-rio-surface p-4 md:p-5 rounded-2xl shadow-sm border transition-all ${
              item.verified && !item.issue ? 'border-rio-success/30 bg-rio-success/5' :
              item.issue ? 'border-rio-danger/30 bg-rio-danger/5' :
              'border-rio-border hover:border-rio-gold/30'
            }`}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-1 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-rio-surface-muted shrink-0 mr-4 border border-rio-border">
                    <img src={product.imageUrl || undefined} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-[11px] font-mono font-bold text-rio-muted">{product.sku}</p>
                      {product.locationCode ? (
                        <span className="text-[10px] font-bold bg-rio-ink text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {product.locationCode}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-rio-danger/10 text-rio-danger border border-rio-danger/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          SIN UBIC
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-rio-ink leading-tight">{product.name}</p>
                    {item.sizeDetails && item.sizeDetails.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.sizeDetails.map(s => (
                           <span key={s.size} className="text-[10px] font-bold text-rio-ink bg-rio-gold-light/20 border border-rio-gold-light/50 px-1.5 py-0.5 rounded">
                             Talla {s.size}: {s.quantity}
                           </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider">Solicitado</p>
                    <p className="text-2xl font-serif font-bold text-rio-ink leading-none mt-1">{item.quantity}</p>
                  </div>
                </div>

                {/* Actions */}
                {activeTab === 'pending' && (
                  <div className="md:w-64 border-t md:border-t-0 md:border-l border-rio-border pt-4 md:pt-0 md:pl-4 flex flex-col justify-center space-y-2">
                    <button
                      onClick={() => handleVerify(item.id, 'ok')}
                      className="w-full flex items-center justify-center py-2.5 px-4 bg-rio-success/10 hover:bg-rio-success/20 text-rio-success font-bold rounded-xl border border-rio-success/20 transition-colors"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Empacado Correcto
                    </button>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Nota de incidencia..."
                        value={issueInputs[item.id] || ''}
                        onChange={e => setIssueInputs({...issueInputs, [item.id]: e.target.value})}
                        className="flex-1 text-[13px] border border-rio-border rounded-xl px-3 bg-rio-surface text-rio-ink placeholder-rio-muted focus:outline-none focus:border-rio-warning focus:ring-1 focus:ring-rio-warning"
                      />
                      <button
                        onClick={() => {
                          const msg = issueInputs[item.id]?.trim();
                          if (!msg) {
                            alert('Por favor escribe una nota de incidencia antes de reportar el problema.');
                            return;
                          }
                          handleVerify(item.id, 'issue', msg);
                        }}
                        className="flex items-center justify-center px-3 bg-rio-warning/10 hover:bg-rio-warning/20 text-rio-warning font-bold rounded-xl border border-rio-warning/20 transition-colors"
                        title="Reportar Incidencia"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Display for Verified Tab */}
              {activeTab === 'verified' && (
                <div className="mt-4 pt-4 border-t border-rio-border/50">
                  {item.issue ? (
                    <div className="flex items-start text-rio-danger text-[13px] font-medium">
                      <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                      <span><strong>Incidencia:</strong> {item.issue}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-rio-success text-[13px] font-medium">
                      <Check className="w-4 h-4 mr-2" />
                      <span>Verificado correctamente</span>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      const newItems = order.items.map(i => i.id === item.id ? { ...i, verified: false, issue: undefined } : i);
                      updateOrder({ ...order, items: newItems });
                    }}
                    className="mt-3 text-[11px] font-bold uppercase tracking-wider text-rio-muted hover:text-rio-ink flex items-center transition-colors"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Deshacer verificación
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {(activeTab === 'pending' ? pendingItems : verifiedItems).length === 0 && (
          <div className="text-center py-12 bg-rio-surface rounded-2xl border border-rio-border border-dashed">
            <p className="text-rio-muted font-medium text-sm">No hay referencias en esta lista.</p>
          </div>
        )}
      </div>

      {pendingItems.length === 0 && totalLines > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-rio-surface border-t border-rio-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-center">
          <button
            onClick={() => router.push(`/admin/pedidos/${order.id}`)}
            className="w-full max-w-md flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
          >
            Volver al Pedido
          </button>
        </div>
      )}
    </div>
  );
}
