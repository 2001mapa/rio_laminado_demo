'use client';

import { useDemo } from '@/lib/DemoContext';
import { Store, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import SellerModal from '@/components/SellerModal';
import { Seller } from '@/lib/types';

export default function AdminVendedoresPage() {
  const { sellers, orders } = useDemo();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const handleOpenNew = () => {
    setSelectedSeller(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-rio-ink">Gestión de Vendedores</h1>
          <p className="text-sm text-rio-muted font-medium mt-1">Administra el personal que usa el punto de venta (POS).</p>
        </div>
        <button onClick={handleOpenNew} className="bg-rio-gold-dark hover:bg-rio-gold text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm">
          + Nuevo Vendedor
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sellers.map((seller) => {
          const sellerOrders = orders.filter(o => o.sellerId === seller.id);
          
          return (
            <div key={seller.id} className="bg-rio-surface rounded-2xl shadow-sm border border-rio-border p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-rio-surface-muted flex items-center justify-center text-xl font-serif text-rio-gold-dark border border-rio-border shrink-0 shadow-sm">
                  {seller.name.charAt(0)}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                  seller.status === 'active' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' : 'bg-rio-danger/10 text-rio-danger border-rio-danger/20'
                }`}>
                  {seller.status === 'active' ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Activo</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Inactivo</>
                  )}
                </span>
              </div>
              
              <h3 className="font-bold text-rio-ink line-clamp-1">{seller.name}</h3>
              <p className="text-sm text-rio-muted mt-1">{seller.email}</p>
              <p className="text-[11px] text-rio-muted font-mono mt-1">ID: {seller.id.split('-')[0]}</p>
              
              <div className="mt-4 pt-4 border-t border-rio-border flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-rio-muted uppercase font-bold tracking-wider">Ventas Generadas</p>
                  <p className="text-lg font-black text-rio-ink">{sellerOrders.length}</p>
                </div>
                <button 
                  onClick={() => handleOpenEdit(seller)}
                  className="flex items-center px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors border border-rio-border bg-rio-background text-rio-ink hover:bg-rio-surface-muted"
                >
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <SellerModal 
        isOpen={isModalOpen}
        sellerToEdit={selectedSeller}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => {
          setIsModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
