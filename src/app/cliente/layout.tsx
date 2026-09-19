'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Search, ShoppingBag, User, LogOut } from 'lucide-react';
import { classNames } from '@/lib/utils';
import { useDemo } from '@/lib/DemoContext';
import ToastContainer from '@/components/ToastContainer';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { cart, orders, currentCustomer } = useDemo();
  
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const adjustedOrdersCount = currentCustomer ? orders.filter(
    o => o.customerId === currentCustomer.id && !o.adjustmentAcknowledged && o.items.some(i => !!i.adjustmentReason)
  ).length : 0;

  const navItems = [
    { name: 'Catálogo', href: '/cliente', icon: LayoutGrid },
    { name: 'Carrito', href: '/cliente/carrito', icon: ShoppingBag, badge: cartCount },
    { name: 'Perfil', href: '/cliente/perfil', icon: User, alert: adjustedOrdersCount > 0 },
  ];

  return (
    <div className="min-h-screen bg-rio-background pb-20 md:pb-0 relative font-sans">
      {/* Top Bar */}
      <header className="bg-rio-surface border-b border-rio-border sticky top-0 z-30 px-4 md:px-8 h-14 md:h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="font-serif font-black text-2xl tracking-tight text-rio-ink">RIO</div>
          <div className="text-[10px] uppercase tracking-wider bg-rio-surface-muted text-rio-gold-dark px-2.5 py-1 rounded-full font-bold border border-rio-border">
            Mayorista
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  "flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  isActive ? "bg-rio-gold-light/20 text-rio-gold-dark" : "text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted"
                )}
              >
                <div className="relative mr-2">
                  <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2 bg-rio-ink text-white text-[9px] font-black min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full border-2 border-rio-surface leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : item.alert ? (
                    <span className="absolute -top-0.5 -right-0.5 bg-rio-warning w-2 h-2 rounded-full border border-rio-surface"></span>
                  ) : null}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <Link 
          href="/api/auth/logout"
          className="p-2 text-rio-muted hover:text-rio-danger transition-colors flex items-center gap-2 rounded-xl hover:bg-rio-danger/5"
          title="Cerrar sesión"
        >
          <span className="hidden md:inline text-sm font-semibold text-rio-danger">Salir</span>
          <LogOut className="w-5 h-5 text-rio-danger" />
        </Link>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 md:px-8 md:py-8">
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-rio-surface border-t border-rio-border z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-rio-gold" : "text-rio-muted hover:text-rio-ink"
                )}
              >
                <div className="relative">
                  <item.icon className={classNames("w-6 h-6", isActive && "text-rio-gold")} strokeWidth={isActive ? 2.5 : 1.5} />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2 bg-rio-ink text-white text-[9px] font-black min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full border-2 border-rio-surface leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : item.alert ? (
                    <span className="absolute top-0 -right-0.5 bg-rio-warning w-2.5 h-2.5 rounded-full border-2 border-rio-surface"></span>
                  ) : null}
                </div>
                <span className={classNames("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
