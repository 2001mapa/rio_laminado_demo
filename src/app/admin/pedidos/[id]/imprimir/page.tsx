'use client';

import { useDemo } from '@/lib/DemoContext';
import { use } from 'react';

export default function PrintableOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, customers, products } = useDemo();

  const order = orders.find(o => o.id === resolvedParams.id);

  if (!order) return <div>Pedido no encontrado</div>;

  const customer = customers.find(c => c.id === order.customerId);

  const sortedItems = [...order.items].sort((a, b) => {
    const pA = products.find(p => p.id === a.productId);
    const pB = products.find(p => p.id === b.productId);
    const locA = pA?.locationCode || '';
    const locB = pB?.locationCode || '';
    
    // Items without location go first
    if (!locA && locB) return -1;
    if (locA && !locB) return 1;
    return locA.localeCompare(locB);
  });

  return (
    <div className="bg-white text-black p-4 max-w-3xl mx-auto print:p-0 print:max-w-none font-sans text-sm">
      <div className="mb-4 print:hidden flex justify-between items-center">
        <div>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-black text-white font-medium rounded-lg text-sm"
          >
            Imprimir Hoja
          </button>
          <p className="text-xs text-gray-500 mt-2">Esta vista simula un talonario de bodega (compacto).</p>
        </div>
      </div>

      {/* TICKET / TALONARIO COMPACTO */}
      <div className="print:block border-2 border-black p-4">
        {/* Header Compacto */}
        <div className="border-b-2 border-black pb-2 mb-3 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">RIO</h1>
            <p className="text-[10px] font-bold uppercase mt-0.5">Almacén B2B</p>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black leading-none">{order.number}</h2>
            <p className="text-[10px] mt-0.5 font-bold">{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
          </div>
          <div className="text-right max-w-[150px]">
            <p className="font-bold uppercase text-[10px] bg-black text-white px-1 py-0.5 inline-block mb-1">Cliente</p>
            <p className="font-bold text-xs truncate">{customer?.name}</p>
          </div>
        </div>

        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <p className="font-bold text-xs uppercase bg-gray-200 inline-block px-3 py-1 rounded-sm border border-black">
            Ordenado por recorrido de bodega
          </p>
        </div>

        {/* Compact Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black border-t-2">
              <th className="py-1 px-1 text-left w-6">#</th>
              <th className="py-1 px-1 text-left w-24">UBICACIÓN</th>
              <th className="py-1 px-1 text-left w-24">REF</th>
              <th className="py-1 px-1 text-center w-12">IMG</th>
              <th className="py-1 px-1 text-center w-12 text-lg">CANT</th>
              <th className="py-1 px-1 text-left">DESCRIPCIÓN</th>
              <th className="py-1 px-1 text-center w-10">OK</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              if (!product) return null;
              
              const isNoLocation = !product.locationCode;

              return (
                <tr key={item.id} className="border-b border-gray-400 break-inside-avoid">
                  <td className="py-2 px-1 text-xs text-gray-500 font-bold">{index + 1}</td>
                  <td className="py-2 px-1">
                    {isNoLocation ? (
                      <span className="bg-black text-white px-1.5 py-0.5 text-xs font-bold whitespace-nowrap">SIN UBIC.</span>
                    ) : (
                      <span className="font-black text-sm whitespace-nowrap">{product.locationCode}</span>
                    )}
                  </td>
                  <td className="py-2 px-1 font-mono font-bold text-sm whitespace-nowrap">
                    {product.sku}
                  </td>
                  <td className="py-2 px-1 text-center">
                    <img 
                      src={product.imageUrl || undefined} 
                      alt="" 
                      className="w-10 h-10 object-cover border border-gray-300 rounded-sm inline-block"
                    />
                  </td>
                  <td className="py-2 px-1 text-center">
                    <span className="text-xl font-black border border-black rounded-sm px-2 py-0.5 inline-block leading-none">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-xs font-medium leading-tight text-gray-800">
                    {product.name}
                  </td>
                  <td className="py-2 px-1 text-center align-middle">
                    <div className="w-6 h-6 border-2 border-black rounded-sm mx-auto"></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-4 pt-2 flex justify-between items-end">
          <div className="text-xs">
            <p><strong>REFS:</strong> {order.items.length}</p>
            <p><strong>UNIDADES:</strong> {order.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
          </div>
          <div className="w-48 border-b-2 border-black text-center pb-0.5 text-[10px] font-bold uppercase">
            Preparado por
          </div>
        </div>
      </div>
    </div>
  );
}
