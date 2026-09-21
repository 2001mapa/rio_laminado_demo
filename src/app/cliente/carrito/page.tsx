'use client';

import { useDemo } from '@/lib/DemoContext';
import { formatPrice } from '@/lib/utils';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CartItemSkeleton } from '@/components/Skeletons';

export default function CarritoPage() {
  const { cart, updateCartQuantity, removeFromCart, currentCustomer, clearCart, addOrder, isLoaded } = useDemo();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountAmount = currentCustomer ? subtotal * (currentCustomer.discount / 100) : 0;
  const total = subtotal - discountAmount;
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSubmit = () => {
    if (cart.length === 0 || !currentCustomer) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newOrder = {
        id: `o${Date.now()}`,
        number: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: currentCustomer.id,
        createdAt: new Date().toISOString(),
        status: 'Reservado' as const,
        items: cart.map(item => ({
          id: `i${Date.now()}${Math.random()}`,
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      addOrder(newOrder);
      clearCart();
      setIsSubmitting(false);
      router.push(`/cliente/pedido/${newOrder.id}`);
    }, 800);
  };

  if (!isLoaded) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-7 w-32 bg-rio-border rounded-lg animate-pulse mb-6" />
        {[1, 2, 3].map(i => <CartItemSkeleton key={i} />)}
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="p-8 text-center mt-10">
        <div className="w-20 h-20 bg-rio-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rio-border">
          <ShoppingCartIcon className="w-8 h-8 text-rio-gold" />
        </div>
        <h2 className="text-xl font-serif text-rio-ink mb-2">Tu pedido está vacío</h2>
        <p className="text-sm text-rio-muted max-w-[250px] mx-auto">Explora nuestro catálogo y agrega productos para iniciar tu reserva.</p>
        <button
          onClick={() => router.push('/cliente')}
          className="mt-8 w-full py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-rio-ink hover:bg-rio-ink/90 transition-colors"
        >
          Ir al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-32">
      <h1 className="text-2xl font-serif text-rio-ink mb-6">Tu Pedido</h1>
      
      <div className="lg:flex lg:gap-8 lg:items-start">
        {/* Cart Items List */}
        <div className="space-y-3 lg:flex-1">
          {cart.map((item) => (
            <div key={item.product.id} className="flex gap-4 p-3.5 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-rio-surface-muted shrink-0 border border-rio-border">
                <img src={item.product.imageUrl || undefined} alt={item.product.name} className="object-cover h-full w-full mix-blend-multiply" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-mono font-semibold text-rio-muted">{item.product.sku}</p>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-rio-muted hover:text-rio-danger p-1 -mt-1 -mr-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-medium text-sm text-rio-ink line-clamp-1 mt-0.5">{item.product.name}</h3>
                  <p className="text-[13px] font-bold text-rio-ink mt-0.5">{formatPrice(item.product.price)}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background h-8">
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-8 text-center text-rio-ink">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        const stockDisponible = item.product.physicalStock - item.product.reservedStock;
                        if (item.quantity >= stockDisponible) {
                          alert(`Solo hay ${stockDisponible} unidades disponibles.`);
                          return;
                        }
                        updateCartQuantity(item.product.id, item.quantity + 1);
                      }}
                      className="w-8 h-full flex items-center justify-center text-rio-muted hover:bg-rio-border transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[13px] text-rio-muted font-bold">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Panel */}
        <div className="lg:w-80 shrink-0 mt-8 lg:mt-0 lg:sticky lg:top-24">
          <div className="bg-rio-surface p-5 rounded-2xl border border-rio-border shadow-sm space-y-3">
            {currentCustomer?.showDiscount ? (
              <>
                <div className="flex justify-between text-sm text-rio-muted">
                  <span>Subtotal ({totalItems} un.)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {currentCustomer.discount > 0 && (
                  <div className="flex justify-between text-sm text-rio-success">
                    <span>Descuento Mayorista ({currentCustomer.discount}%)</span>
                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-rio-border pt-3 flex justify-between font-bold text-rio-ink text-lg">
                  <span>Total Estimado</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <span className="text-rio-ink font-bold text-lg block mb-1">{totalItems} unidades</span>
                <span className="text-rio-muted text-sm block">en tu pedido actual</span>
              </div>
            )}
          </div>

          <div className="mt-4 lg:mt-6">
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-rio-ink hover:bg-rio-ink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rio-ink disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Procesando...' : 'Enviar Pedido'}
            </button>
            <p className="mt-4 text-[11px] text-center text-rio-muted font-medium lg:max-w-none max-w-[280px] mx-auto">
              Al enviar, tus unidades quedan reservadas para RIO. Podrás modificar tu reserva luego.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShoppingCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1.5" />
      <circle cx="19" cy="21" r="1.5" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
