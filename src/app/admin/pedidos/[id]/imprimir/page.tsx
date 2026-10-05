'use client';
import { ArrowLeft, FileText, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';

import { useDemo } from '@/lib/DemoContext';
import { getOrderById } from '@/app/actions/orders';
import { use, useState, useEffect } from 'react';
import styles from './page.module.css';

export default function PrintableOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, customers, products } = useDemo();
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState('');
  
  useEffect(() => {
    getOrderById(resolvedParams.id).then((res: any) => {
      if (res.success) {
        setFetchedOrder(res.order);
      } else {
        setOrderError(res.message);
      }
      setIsLoadingOrder(false);
    });
  }, [resolvedParams.id]);


  
  const contextOrder = orders.find(o => o.id === resolvedParams.id);
  const order = contextOrder || fetchedOrder;
  
  if (isLoadingOrder && !order) return <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-rio-muted print:hidden"><Loader2 className="w-10 h-10 animate-spin" /><p className="font-bold uppercase tracking-widest text-sm">Cargando pedido...</p></div>;
  if (orderError && !order) return <div className="p-4 text-red-500">{orderError}</div>;
  

  if (!order) return <div>Pedido no encontrado</div>;

  const customer = order.customer || customers.find(c => c.id === order.customerId);

  const locationCollator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  const sortedItems = [...order.items].sort((a, b) => {
    const pA = (a as any).product;
    const pB = (b as any).product;
    const locA = pA?.locationCode || '';
    const locB = pB?.locationCode || '';
    
    // Keep products without a location after the numbered warehouse route.
    if (!locA && locB) return 1;
    if (locA && !locB) return -1;
    return locationCollator.compare(locA, locB);
  });

  return (
    <div className="min-h-screen bg-rio-background px-4 py-6 font-sans text-sm text-rio-ink md:px-8 md:py-8 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl print:max-w-none">
      <div className="mb-6 print:hidden">
        <Link href={`/admin/pedidos/${resolvedParams.id}`} className="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-rio-muted hover:text-rio-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rio-ink">
          <ArrowLeft className="h-4 w-4" /> Volver al pedido
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rio-muted">Documento de bodega</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-rio-ink md:text-3xl">Vista previa de la hoja</h1>
            <p className="mt-1 text-sm text-rio-muted">Pedido {order.number} · {order.items.length} referencias · {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} unidades</p>
          </div>
          <button onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rio-ink px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rio-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rio-ink">
            <Printer className="h-4 w-4" /> Imprimir hoja
          </button>
        </div>
      </div>

      <section aria-label="Vista previa de hoja de bodega" className="rounded-2xl border border-rio-border bg-white p-3 shadow-sm md:p-6 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="mb-4 flex items-center gap-2 border-b border-rio-border pb-4 text-xs text-rio-muted print:hidden">
          <FileText className="h-4 w-4 text-rio-gold-dark" />
          <span>Previsualización del documento compacto. Revisa los datos antes de imprimir.</span>
        </div>

      {/* TICKET / TALONARIO COMPACTO */}
      <div className={`border-2 border-black p-4 ${styles.printSheet}`}>
        {/* Header Compacto */}
        <div className={`border-b-2 border-black pb-2 mb-2 ${styles.orderHeader}`}>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">RIO</h1>
            <p className="text-[9px] font-bold uppercase mt-0.5">Almacén B2B</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black leading-none">{order.number}</h2>
            <p className="text-[9px] mt-1 font-bold">{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
          </div>
          <div className="text-right min-w-0">
            <p className="font-bold uppercase text-[9px] text-gray-600 mb-0.5">Cliente</p>
            <p className="font-bold text-xs leading-tight break-words">{customer?.name}</p>
            {customer?.city && <p className="text-[10px] leading-tight break-words">{customer.city}</p>}
            {customer?.address && <p className="text-[10px] leading-tight break-words">{customer.address}</p>}
          </div>
        </div>

        {/* Compact Table */}
        <table className={`w-full border-collapse ${styles.orderTable}`}>
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '39%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-black border-t-2">
              <th className="py-1 px-1 text-left">#</th>
              <th className="py-1 px-1 text-left">UBICACIÓN</th>
              <th className="py-1 px-1 text-left">REF</th>
              <th className="py-1 px-1 text-center">IMG</th>
              <th className="py-1 px-1 text-center text-sm">CANT</th>
              <th className="py-1 px-2 text-left">DESCRIPCIÓN</th>
              <th className="py-1 px-1 text-center">OK</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => {
              const product = (item as any).product;
              if (!product) return null;
              
              const isNoLocation = !product.locationCode;

              return (
                <tr key={item.id} className={`border-b border-gray-400 ${styles.itemRow}`}>
                  <td className="py-px px-1 text-[10px] text-gray-500 font-bold">{index + 1}</td>
                  <td className={`py-px px-1 ${styles.locationCell}`}>
                    {isNoLocation ? (
                      <span className="bg-black text-white px-1 py-0.5 text-[10px] font-bold whitespace-nowrap">SIN UBIC.</span>
                    ) : (
                      <span className="font-black text-[11px]">{product.locationCode}</span>
                    )}
                  </td>
                  <td className={`py-px px-1 font-mono font-bold text-[11px] leading-tight ${styles.referenceCell}`}>
                    {product.sku}
                  </td>
                  <td className="py-px px-1 text-center">
                    <img 
                      src={product.imageUrl || undefined} 
                      alt="" 
                      className="w-[22px] h-[22px] object-cover border border-gray-300 rounded-sm inline-block"
                    />
                  </td>
                  <td className="py-px px-1 text-center">
                    <span className="text-sm font-black border border-black rounded-sm px-1 py-0.5 inline-block leading-none">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-px px-2 text-[10px] font-medium leading-tight text-gray-800">
                    {product.name}
                    {item.sizeDetails && item.sizeDetails.length > 0 && (
                      <div className="text-[9px] font-bold text-black bg-gray-100 px-1 py-0.5 rounded inline-block">
                        Tallas: {item.sizeDetails.map((s: any) => `${s.size} x ${s.quantity}`).join(' | ')}
                      </div>
                    )}
                  </td>
                  <td className="py-px px-1 text-center align-middle">
                    <div className="w-4 h-4 border-2 border-black rounded-sm mx-auto"></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className={`mt-4 pt-2 flex justify-between items-end ${styles.orderFooter}`}>
          <div className="text-xs">
            <p><strong>REFS:</strong> {order.items.length}</p>
            <p><strong>UNIDADES:</strong> {order.items.reduce((acc: any, item: any) => acc + item.quantity, 0)}</p>
          </div>
          <div className={`w-48 ${styles.signature}`}>
            <span>Preparado por</span>
            <span className={styles.signatureLine} aria-hidden="true" />
          </div>
        </div>
      </div>
      </section>
      </div>
    </div>
  );
}
