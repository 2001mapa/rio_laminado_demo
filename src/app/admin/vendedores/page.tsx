'use client';

import { useDemo } from '@/lib/DemoContext';
import { Store, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminVendedoresPage() {
  const { sellers, orders } = useDemo();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-rio-ink">Gestión de Vendedores</h1>
          <p className="text-sm text-rio-muted font-medium mt-1">Administra el personal que usa el punto de venta (POS).</p>
        </div>
        <button className="bg-rio-gold-dark hover:bg-rio-gold text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm">
          + Nuevo Vendedor
        </button>
      </div>

      <div className="bg-rio-surface rounded-2xl shadow-sm border border-rio-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-rio-border">
            <thead className="bg-rio-background">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Ventas Generadas</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-rio-muted uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-rio-muted uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-rio-surface divide-y divide-rio-border">
              {sellers.map((seller) => {
                const sellerOrders = orders.filter(o => o.sellerId === seller.id);
                
                return (
                  <tr key={seller.id} className="hover:bg-rio-surface-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-rio-gold/10 text-rio-gold-dark rounded-full flex items-center justify-center font-bold font-serif">
                          {seller.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-[13px] font-bold text-rio-ink">{seller.name}</div>
                          <div className="text-[10px] text-rio-muted font-mono">{seller.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-rio-muted">
                      {seller.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[13px] font-bold text-rio-ink">{sellerOrders.length}</div>
                      <div className="text-[10px] text-rio-muted">pedidos</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {seller.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-bold">
                      <button className="text-rio-gold-dark hover:text-rio-gold transition-colors">
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
