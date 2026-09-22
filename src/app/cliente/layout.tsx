'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Search, ShoppingBag, User, LogOut } from 'lucide-react';
import { classNames } from '@/lib/utils';
import { useDemo } from '@/lib/DemoContext';
import ToastContainer from '@/components/ToastContainer';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, orders, currentCustomer } = useDemo();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'cliente') {
        console.log('[Layout Cliente] No session or wrong role', { hasSession: !!session, error: error?.message });
        router.push('/login');
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  if (!isAuthorized) return <div className="min-h-screen bg-rio-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-rio-gold border-t-transparent rounded-full animate-spin"></div></div>;
  
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
          href="/cliente/perfil"
          aria-label="Ir a mi perfil"
          className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-rio-ink text-white flex items-center justify-center font-bold font-serif text-sm md:text-base border-2 border-rio-surface-muted shadow-sm hover:scale-105 transition-transform shrink-0"
        >
          {currentCustomer?.name ? currentCustomer.name.charAt(0).toUpperCase() : 'U'}
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
