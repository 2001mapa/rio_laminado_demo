'use client';

import { useDemo } from '@/lib/DemoContext';
import { Plus, Users, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import CreateCustomerModal from '@/components/CreateCustomerModal';

export default function ClientesPage() {
  const { customers, refreshData, onlineUsers } = useDemo();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-serif font-bold text-rio-ink">Clientes Mayoristas</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-rio-muted" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-rio-border rounded-xl leading-5 bg-rio-surface placeholder-rio-muted text-sm focus:outline-none focus:ring-1 focus:ring-rio-gold focus:border-rio-gold text-rio-ink"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-rio-surface rounded-2xl shadow-sm border border-rio-border p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-rio-surface-muted flex items-center justify-center text-xl font-serif text-rio-gold-dark border border-rio-border shrink-0 shadow-sm">
                  {customer.name.charAt(0)}
                </div>
                {customer.authUserId && onlineUsers.includes(customer.authUserId) ? (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-rio-surface rounded-full" title="En línea" aria-label="En línea" />
                ) : (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-400 border-2 border-rio-surface rounded-full" title="Desconectado" aria-label="Desconectado" />
                )}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                customer.status === 'active' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' : 'bg-rio-danger/10 text-rio-danger border-rio-danger/20'
              }`}>
                {customer.status === 'active' ? 'Activo' : 'Suspendido'}
              </span>
            </div>
            
            <h3 className="font-bold text-rio-ink line-clamp-1">{customer.name}</h3>
            <p className="text-sm text-rio-muted mt-1">{customer.email}</p>
            <p className="text-sm text-rio-muted">{customer.phone}</p>
            
            <div className="mt-4 pt-4 border-t border-rio-border flex justify-between items-center">
              <div>
                <p className="text-[10px] text-rio-muted uppercase font-bold tracking-wider">Descuento</p>
                <p className="text-lg font-black text-rio-ink">{customer.discount}%</p>
              </div>
              <Link 
                href={`/admin/clientes/${customer.id}`}
                className="flex items-center px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors border border-rio-border bg-rio-background text-rio-ink hover:bg-rio-surface-muted"
              >
                Ver Perfil
              </Link>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center bg-rio-surface rounded-2xl border border-rio-border border-dashed">
            <Users className="w-8 h-8 text-rio-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-rio-muted">No se encontraron clientes.</p>
          </div>
        )}
      </div>

      <CreateCustomerModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onComplete={() => {
          setShowModal(false);
          refreshData();
        }}
      />
    </div>
  );
}
