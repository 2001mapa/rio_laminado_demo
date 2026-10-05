'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';

export default function VendedorPedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, currentSeller, customers, isLoaded } = useDemo();
  const order = currentSeller ? orders.find(candidate => candidate.id === id && candidate.sellerId === currentSeller.id) : undefined;

  if (!isLoaded || !currentSeller) {
    return <div className="p-6 text-sm text-rio-muted">Cargando pedido...</div>;
  }

  if (!order) {
    return <div className="mx-auto max-w-4xl p-4 pb-28 md:p-8"><Link href="/vendedor/perfil" className="inline-flex items-center gap-2 text-sm font-semibold text-rio-gold-dark"><ArrowLeft className="h-4 w-4" /> Volver a mis ventas</Link><p className="mt-6 rounded-2xl border border-rio-border bg-white p-6 text-sm text-rio-muted">No se encontró este pedido entre tus ventas.</p></div>;
  }

  const customerName = order.customer?.name || customers.find(customer => customer.id === order.customerId)?.name || 'Cliente no disponible';
  const totalUnits = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 pb-28 md:p-8">
      <Link href="/vendedor/perfil" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-rio-gold-dark hover:underline"><ArrowLeft className="h-4 w-4" /> Mis ventas</Link>
      <header className="rounded-2xl border border-rio-border bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wider text-rio-muted">Detalle de venta</p><h1 className="mt-1 text-2xl font-serif font-bold text-rio-ink md:text-3xl">{order.number}</h1></div>
          <span className="rounded-lg border border-rio-gold-light bg-rio-gold-light/20 px-3 py-1.5 text-xs font-bold text-rio-gold-dark">{order.status}</span>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-rio-border pt-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs font-bold uppercase text-rio-muted">Cliente</dt><dd className="mt-1 font-semibold text-rio-ink">{customerName}</dd></div>
          <div><dt className="text-xs font-bold uppercase text-rio-muted">Fecha</dt><dd className="mt-1 font-semibold text-rio-ink">{new Date(order.createdAt).toLocaleDateString('es-CO')}</dd></div>
          <div><dt className="text-xs font-bold uppercase text-rio-muted">Contenido</dt><dd className="mt-1 font-semibold text-rio-ink">{order.items.length} referencias · {totalUnits} unidades</dd></div>
        </dl>
        {(order.carrier || order.trackingNumber) && <div className="mt-4 border-t border-rio-border pt-4 text-sm text-rio-ink">{order.carrier && <p><span className="font-semibold">Transportadora:</span> {order.carrier}</p>}{order.trackingNumber && <p><span className="font-semibold">Guía:</span> {order.trackingNumber}</p>}</div>}
      </header>

      <section className="rounded-2xl border border-rio-border bg-white p-5 shadow-sm md:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-rio-ink"><Package className="h-5 w-5 text-rio-gold-dark" /> Referencias del pedido</h2>
        <div className="mt-4 divide-y divide-rio-border">
          {order.items.map(item => (
            <article key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-rio-border bg-rio-background">
                {item.product?.imageUrl ? <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-rio-muted">Sin foto</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono font-semibold text-rio-muted">{item.product?.sku || item.productId}</p>
                <p className="mt-0.5 text-sm font-semibold text-rio-ink">{item.product?.name || 'Producto'}</p>
                {item.sizeDetails && item.sizeDetails.length > 0 && <p className="mt-1 text-xs text-rio-muted">Tallas: {item.sizeDetails.map(size => `${size.size} × ${size.quantity}`).join(' · ')}</p>}
                {item.adjustmentReason && <p className="mt-1 text-xs text-rio-warning">Ajuste: {item.adjustmentReason}</p>}
              </div>
              <div className="shrink-0 text-right"><p className="text-sm font-bold text-rio-ink">Cant: {item.quantity}</p>{typeof item.priceAtTime === 'number' && <p className="mt-1 text-xs text-rio-muted">{formatPrice(item.priceAtTime)} c/u</p>}</div>
            </article>
          ))}
        </div>
        {typeof order.totalAmount === 'number' && <p className="mt-5 border-t border-rio-border pt-4 text-right text-base font-bold text-rio-ink">Total: {formatPrice(order.totalAmount)}</p>}
      </section>
      <p className="text-xs text-rio-muted">Esta vista es solo de consulta. Los cambios de estado y la facturación los gestiona administración.</p>
    </div>
  );
}
