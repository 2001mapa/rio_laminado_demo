'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ScanLine, User, LogOut } from 'lucide-react';
import { classNames } from '@/lib/utils';
import ToastContainer from '@/components/ToastContainer';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'vendedor') {
        router.push('/login');
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  if (!isAuthorized) return <div className="min-h-screen bg-rio-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-rio-gold border-t-transparent rounded-full animate-spin"></div></div>;

  const navItems = [
    { name: 'Dashboard', href: '/vendedor', icon: LayoutDashboard },
    { name: 'Nueva Venta', href: '/vendedor/nueva-venta', icon: ScanLine },
    { name: 'Perfil', href: '/vendedor/perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-rio-background pb-20 md:pb-0 relative font-sans">
      {/* Top Bar */}
      <header className="bg-rio-surface border-b border-rio-border sticky top-0 z-30 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3 md:w-1/3">
          <div className="font-serif font-black text-2xl tracking-tight text-rio-ink">RIO</div>
          <div className="text-[10px] uppercase tracking-wider bg-rio-gold-light/20 text-rio-gold-dark px-2.5 py-1 rounded-full font-bold border border-rio-gold-light/30 hidden sm:block">
            Punto de Venta
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center justify-center space-x-2 md:w-1/3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  "px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-semibold text-sm",
                  isActive 
                    ? "bg-rio-gold-light/20 text-rio-gold-dark" 
                    : "text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted"
                )}
              >
                <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex justify-end md:w-1/3">
          <Link 
            href="/api/auth/logout"
            className="p-2 text-rio-muted hover:text-rio-danger transition-colors flex items-center gap-2 rounded-xl hover:bg-rio-danger/5"
            title="Salir de la Demo"
          >
            <span className="hidden md:inline text-sm font-semibold text-rio-danger">Salir</span>
            <LogOut className="w-5 h-5 text-rio-danger" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-0 md:px-6 bg-white min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-4rem)] md:mt-4 shadow-sm md:rounded-2xl pb-8 mb-8">
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-rio-surface border-t border-rio-border z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-rio-gold-dark" : "text-rio-muted hover:text-rio-ink"
                )}
              >
                <div className="relative">
                  <item.icon className={classNames("w-6 h-6", isActive && "text-rio-gold-dark")} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className={classNames("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ToastContainer />
    </div>
  );
}
