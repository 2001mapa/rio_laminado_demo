'use client';

import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Edit2, Info, CheckCircle2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { use, useState } from 'react';
import Link from 'next/link';

export default function PedidoClientePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, products, updateOrderStatus, updateOrder } = useDemo();
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
      updateOrderStatus(order.id, 'Cancelado');
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-rio-muted hover:text-rio-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-serif font-bold text-rio-ink">Reserva {order.number}</h1>
      </div>

      <div className="bg-rio-surface p-5 rounded-2xl border border-rio-border shadow-sm mb-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase text-rio-muted tracking-wider">Estado</p>
            <div className={`mt-1 inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border ${
              order.status === 'Reservado' ? 'bg-rio-gold-light/30 text-rio-gold-dark border-rio-gold-light' :
              order.status === 'Cancelado' ? 'bg-rio-danger/10 text-rio-danger border-rio-danger/20' :
              order.status === 'Verificado' || order.status === 'Despachado' || order.status === 'Empacado' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' :
              order.status === 'En preparación' ? 'bg-purple-50 text-purple-700 border-purple-100' :
              'bg-rio-warning/10 text-rio-warning border-rio-warning/20'
            }`}>
              {order.status}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase text-rio-muted tracking-wider">Fecha</p>
            <p className="text-sm font-semibold text-rio-ink mt-1">
              {new Date(order.createdAt).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>

        {!isEditable && order.status !== 'Cancelado' && (
          <div className="mt-4 bg-rio-background border border-rio-border rounded-xl p-4 flex items-start">
            <Info className="w-4 h-4 text-rio-gold-dark shrink-0 mt-0.5 mr-2.5" />
            <p className="text-[12px] text-rio-ink font-medium leading-relaxed">
              Este pedido ya está en proceso ({order.status}). Si necesitas realizar cambios, por favor comunícate directamente con tu asesor de RIO.
            </p>
          </div>
        )}
        
        {order.status === 'Reservado' && (
          <div className="mt-4 bg-rio-success/5 border border-rio-success/20 rounded-xl p-4 flex items-start">
            <CheckCircle2 className="w-4 h-4 text-rio-success shrink-0 mt-0.5 mr-2.5" />
            <p className="text-[12px] text-rio-success font-medium leading-relaxed">
              Tu pedido fue recibido y las unidades quedaron reservadas.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-serif font-bold text-rio-ink">Referencias ({order.items.length})</h2>
          {isEditable && (
            <button className="text-xs font-bold text-rio-gold-dark flex items-center hover:text-rio-gold transition-colors" onClick={() => alert('En esta demo simulada, para editar, puedes cancelar el pedido y crear uno nuevo.')}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Editar
            </button>
          )}
        </div>
        
        {order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) return null;
          
          return (
            <div key={item.id} className="flex gap-4 bg-rio-surface p-3.5 rounded-2xl border border-rio-border shadow-sm">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-rio-surface-muted shrink-0">
                <img src={product.image} alt={product.name} className="object-cover h-full w-full mix-blend-multiply" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-mono font-semibold text-rio-muted">{product.sku}</p>
                  <p className="text-sm font-semibold text-rio-ink bg-rio-background px-2 py-0.5 rounded-md border border-rio-border">x{item.quantity}</p>
                </div>
                <h3 className="font-medium text-sm text-rio-ink truncate mt-1">{product.name}</h3>
                <p className="text-[13px] font-bold text-rio-ink mt-1">{formatPrice(product.price * item.quantity)}</p>
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
