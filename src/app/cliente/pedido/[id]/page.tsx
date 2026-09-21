'use client';

import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

  const totalUnits = order.items.reduce((acc, item) => acc + item.quantity, 0);

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
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="mr-4 text-rio-muted hover:text-rio-ink transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-serif font-bold text-rio-ink">Pedido #{order.number}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-rio-ink">
            {new Date(order.createdAt).toLocaleDateString('es-CO')}
          </p>
        </div>
      </div>

      <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border mb-8">
        {order.status === 'Cancelado' ? (
          <div className="bg-rio-danger/10 border border-rio-danger/20 p-6 rounded-xl text-center">
            <p className="text-lg font-bold text-rio-danger mb-2">{publicStateStr}</p>
            <p className="text-sm text-rio-danger font-medium">{publicMessageStr}</p>
          </div>
        ) : (
          <div>
            <div className="bg-rio-surface-muted/50 p-6 rounded-xl border border-rio-border text-center mb-8">
              <p className="text-xl font-bold text-rio-ink mb-2">{publicStateStr}</p>
              <p className="text-sm font-medium text-rio-muted max-w-sm mx-auto leading-relaxed">{publicMessageStr}</p>
            </div>
            
            {/* Progress Bar - Responsive */}
            <div className="mt-10 mb-6">
              
              {/* Desktop Stepper */}
              <div className="hidden sm:block relative px-4">
                <div className="absolute top-3.5 left-12 right-12 h-1 bg-rio-border z-0 rounded-full"></div>
                <div 
                  className="absolute top-3.5 left-12 h-1 bg-rio-ink z-0 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `calc(${(getMilestoneIndex(publicStateStr) / (PUBLIC_MILESTONES.length - 1)) * 100}% - 3rem)` }}
                ></div>
                
                <div className="relative z-10 flex justify-between">
                  {PUBLIC_MILESTONES.map((milestone, idx) => {
                    const currentIndex = getMilestoneIndex(publicStateStr);
                    const isCompleted = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;
                    
                    return (
                      <div key={milestone} className="flex flex-col items-center w-28">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-[3px] mb-4 bg-white ${
                          isCompleted ? 'border-rio-ink bg-rio-ink text-white' : 'border-rio-border text-transparent'
                        }`}>
                          {isCompleted && <Check className="w-4 h-4" strokeWidth={3} />}
                        </div>
                        <span className={`text-[11px] uppercase font-bold text-center leading-tight ${
                          isCurrent ? 'text-rio-ink' : isCompleted ? 'text-rio-muted' : 'text-rio-border'
                        }`}>
                          {milestone}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Stepper */}
              <div className="sm:hidden flex flex-col space-y-6 px-4">
                {PUBLIC_MILESTONES.map((milestone, idx) => {
                  const currentIndex = getMilestoneIndex(publicStateStr);
                  const isCompleted = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  const isLast = idx === PUBLIC_MILESTONES.length - 1;
                  
                  return (
                    <div key={milestone} className="relative flex items-start">
                      {!isLast && (
                        <div className={`absolute top-8 left-4 w-0.5 h-[calc(100%+8px)] -ml-[1px] ${
                           idx < currentIndex ? 'bg-rio-ink' : 'bg-rio-border'
                        }`}></div>
                      )}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-[3px] shrink-0 bg-white ${
                        isCompleted ? 'border-rio-ink bg-rio-ink text-white' : 'border-rio-border text-transparent'
                      }`}>
                        {isCompleted && <Check className="w-4 h-4" strokeWidth={3} />}
                      </div>
                      <span className={`ml-4 mt-1.5 text-[12px] uppercase font-bold tracking-wide ${
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

        {!order.adjustmentAcknowledged && order.items.some(i => !!i.adjustmentReason) && (
          <div className="mt-8 bg-rio-warning/10 border border-rio-warning/30 rounded-xl p-5">
            <div className="flex items-start mb-4">
              <Info className="w-5 h-5 text-rio-warning shrink-0 mt-0.5 mr-3" />
              <p className="text-sm text-rio-warning font-bold leading-relaxed">
                Actualización: Se ajustaron las cantidades de algunos productos. Revisa el motivo en la sección de productos.
              </p>
            </div>
            <button
              onClick={handleAcknowledge}
              className="w-full bg-white hover:bg-rio-surface text-rio-warning font-bold text-sm py-3 rounded-lg transition-colors border border-rio-warning/30 shadow-sm"
            >
              Entendido
            </button>
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-serif font-bold text-rio-ink mb-1">Productos del pedido</h2>
          <p className="text-sm text-rio-muted font-medium">
            {order.items.length} {order.items.length === 1 ? 'referencia' : 'referencias'} &middot; {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
        
        <div className="space-y-4">
          {order.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;
            
            const isAdjusted = item.originalQuantity !== undefined && item.originalQuantity !== item.quantity;
            
            return (
              <div key={item.id} className="bg-white p-5 rounded-xl border border-rio-border flex flex-col sm:flex-row gap-5 sm:items-center shadow-sm">
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-20 h-20 rounded-lg bg-rio-surface-muted overflow-hidden shrink-0 border border-rio-border/50">
                    <img src={product.imageUrl || undefined} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-mono font-semibold text-rio-muted block mb-1">{product.sku}</span>
                    <p className="text-base font-semibold text-rio-ink truncate mb-1.5">{product.name}</p>
                    <span className="text-sm font-bold text-rio-gold-dark block">{formatPrice(product.price)} <span className="text-xs text-rio-muted font-medium">c/u</span></span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 sm:min-w-[240px]">
                  <div className="bg-rio-surface p-4 rounded-xl border border-rio-border">
                    {isAdjusted ? (
                      <div className="space-y-2">
                        <p className="text-[13px] font-medium text-rio-muted flex justify-between">
                          <span>Cant. solicitada:</span>
                          <span className="line-through">{item.originalQuantity}</span>
                        </p>
                        <p className="text-[14px] font-bold text-rio-ink flex justify-between">
                          <span>Cant. confirmada:</span>
                          <span>{item.quantity}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[14px] font-bold text-rio-ink text-center sm:text-left">
                        Cantidad solicitada: {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                      </p>
                    )}
                  </div>
                  
                  {isAdjusted && item.adjustmentReason && (
                    <div className="text-[12px] font-medium text-rio-warning bg-rio-warning/10 px-3.5 py-3 rounded-xl border border-rio-warning/20">
                      <strong>Motivo:</strong> {item.adjustmentReason}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isEditable && (
        <div className="mt-12">
          <button
            onClick={handleCancel}
            className="w-full flex justify-center py-4 px-4 border border-rio-danger/30 rounded-xl text-sm font-bold text-rio-danger bg-rio-danger/5 hover:bg-rio-danger/10 transition-colors"
          >
            Cancelar Pedido
          </button>
        </div>
      )}
    </div>
  );
}
