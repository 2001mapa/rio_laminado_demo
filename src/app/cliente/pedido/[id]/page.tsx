'use client';

import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Check, CheckCircle2, Info } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { use } from 'react';
import { PUBLIC_STATES, PUBLIC_MESSAGES, PUBLIC_MILESTONES, getMilestoneIndex } from '@/lib/order-status';

export default function PedidoClientePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, products, transitionOrder, acknowledgeAdjustment } = useDemo();
  const router = useRouter();

  const order = orders.find(o => o.id === resolvedParams.id);

  if (!order) {
    return <div className="p-4 text-rio-muted">Pedido no encontrado</div>;
  }

  const isEditable = order.status === 'Reservado';

  const calculateTotal = () => {
    return order.items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      return acc + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleCancel = () => {
    if (confirm('¿Seguro que deseas cancelar este pedido? Las unidades reservadas se liberarán.')) {
      transitionOrder(order.id, 'CANCEL');
    }
  };

  const handleAcknowledge = () => {
    acknowledgeAdjustment(order.id);
  };

  const publicStateStr = PUBLIC_STATES[order.status as keyof typeof PUBLIC_STATES];
  const publicMessageStr = PUBLIC_MESSAGES[order.status as keyof typeof PUBLIC_MESSAGES];

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-rio-muted hover:text-rio-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-serif font-bold text-rio-ink">Reserva {order.number}</h1>
      </div>

      <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border mb-6">
        <h3 className="text-sm font-bold text-rio-ink uppercase tracking-wider mb-4">Estado del Pedido</h3>
        
        {order.status === 'Cancelado' ? (
          <div className="bg-rio-danger/10 border border-rio-danger/20 p-4 rounded-xl text-center mb-6">
            <p className="text-lg font-bold text-rio-danger mb-2">{publicStateStr}</p>
            <p className="text-sm text-rio-danger font-medium">{publicMessageStr}</p>
          </div>
        ) : (
          <div className="mb-2">
            <div className="bg-rio-surface-muted/50 p-4 rounded-xl border border-rio-border text-center mb-6">
              <p className="text-xl font-bold text-rio-ink mb-1">{publicStateStr}</p>
              <p className="text-sm font-medium text-rio-muted max-w-sm mx-auto">{publicMessageStr}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="relative mt-8 mb-4 px-4">
              <div className="absolute top-1/2 left-8 right-8 h-1 bg-rio-border -translate-y-1/2 z-0 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-8 h-1 bg-rio-ink -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(getMilestoneIndex(publicStateStr) / (PUBLIC_MILESTONES.length - 1)) * 100}%` }}
              ></div>
              
              <div className="relative z-10 flex justify-between">
                {PUBLIC_MILESTONES.map((milestone, idx) => {
                  const currentIndex = getMilestoneIndex(publicStateStr);
                  const isCompleted = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  
                  return (
                    <div key={milestone} className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mb-2 bg-white ${
                        isCompleted ? 'border-rio-ink bg-rio-ink text-white' : 'border-rio-border text-transparent'
                      }`}>
                        {isCompleted && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-[10px] uppercase font-bold text-center max-w-[70px] ${
                        isCurrent ? 'text-rio-ink' : isCompleted ? 'text-rio-muted' : 'text-rio-border'
                      }`}>
                        {milestone}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-rio-surface p-5 rounded-2xl border border-rio-border shadow-sm mb-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase text-rio-muted tracking-wider">Fecha</p>
            <p className="text-sm font-semibold text-rio-ink mt-1">
              {new Date(order.createdAt).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>

        {!order.adjustmentAcknowledged && order.items.some(i => !!i.adjustmentReason) && (
          <div className="mt-4 bg-rio-warning/10 border border-rio-warning/30 rounded-xl p-4">
            <div className="flex items-start mb-3">
              <Info className="w-5 h-5 text-rio-warning shrink-0 mt-0.5 mr-2.5" />
              <p className="text-[12px] text-rio-warning font-bold leading-relaxed">
                Actualización: Se ajustaron cantidades en tu orden por motivos operativos. Revisa el detalle a continuación y tu nuevo total a pagar.
              </p>
            </div>
            <button
              onClick={handleAcknowledge}
              className="w-full bg-white/50 hover:bg-white text-rio-warning font-bold text-xs py-2 rounded-lg transition-colors border border-rio-warning/30 shadow-sm"
            >
              Entendido, confirmar la actualización
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-rio-ink">Referencias ({order.items.length})</h2>
        </div>
        
        {order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) return null;
          
          return (
            <div key={item.id} className="bg-white p-3 rounded-xl border border-rio-border flex gap-4 items-center shadow-sm">
              <div className="w-14 h-14 rounded-lg bg-rio-surface-muted overflow-hidden shrink-0 border border-rio-border/50">
                <img src={product.imageUrl || undefined} alt="" className="w-full h-full object-cover mix-blend-multiply" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-rio-muted">{product.sku}</span>
                  <div className="text-right">
                    {item.originalQuantity !== undefined && item.originalQuantity !== item.quantity && (
                      <span className="text-[10px] line-through text-rio-muted mr-2">x {item.originalQuantity}</span>
                    )}
                    <span className="text-xs font-bold text-rio-ink">x {item.quantity}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-rio-ink truncate mb-1">{product.name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-rio-gold-dark">{formatPrice(product.price)}</span>
                  <span className="text-sm font-black text-rio-ink">{formatPrice(product.price * item.quantity)}</span>
                </div>
                {item.adjustmentReason && (
                  <div className="mt-2 text-[10px] font-medium text-rio-warning bg-rio-warning/10 px-2.5 py-1.5 rounded-lg border border-rio-warning/20">
                    <strong>Ajustado:</strong> {item.adjustmentReason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-rio-surface p-5 rounded-2xl border border-rio-border shadow-sm mb-6">
        <div className="flex justify-between font-bold text-rio-ink text-lg">
          <span>Total Estimado</span>
          <span>{formatPrice(calculateTotal())}</span>
        </div>
      </div>

      {isEditable && (
        <div className="mt-8">
          <button
            onClick={handleCancel}
            className="w-full flex justify-center py-3.5 px-4 border border-rio-danger/30 rounded-xl text-sm font-bold text-rio-danger bg-rio-danger/5 hover:bg-rio-danger/10 transition-colors"
          >
            Cancelar Pedido
          </button>
        </div>
      )}
    </div>
  );
}
