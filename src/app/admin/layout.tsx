'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, PackageSearch, Users, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { classNames } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/admin/pedidos', icon: Inbox },
    { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-rio-background flex flex-col md:flex-row font-sans pb-20 md:pb-0 relative">
      {/* Sidebar Desktop / Topbar Mobile */}
      <aside className={classNames(
        "w-full bg-rio-surface text-rio-ink flex flex-col md:min-h-screen shrink-0 border-r border-rio-border print:hidden transition-all duration-300",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}>
        <div className={classNames("p-4 md:p-6 flex items-center justify-between", isCollapsed ? "md:justify-center md:px-0" : "md:justify-start")}>
          <div className={classNames("overflow-hidden transition-all duration-300 flex-1", isCollapsed ? "md:hidden" : "")}>
            <h1 className="font-serif font-bold text-2xl tracking-tight text-rio-ink whitespace-nowrap">RIO</h1>
            <p className="text-[10px] text-rio-muted uppercase tracking-widest mt-1 font-bold whitespace-nowrap">Bodega B2B</p>
          </div>
          
          {/* Collapse Toggle Desktop */}
          <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className={classNames("hidden md:flex p-1.5 rounded-lg hover:bg-rio-surface-muted transition-colors text-rio-muted hover:text-rio-ink shrink-0", isCollapsed ? "" : "ml-auto")}
             aria-label="Toggle Sidebar"
          >
             {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Mobile elements (only visible on mobile) */}
          <div className="flex items-center space-x-3 md:hidden">
            <div className="bg-rio-surface-muted text-rio-gold-dark border border-rio-border text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wider">
              Demo
            </div>
            <Link 
              href="/acceso-rio"
              className="p-2 -mr-2 text-rio-muted hover:text-rio-danger transition-colors flex items-center"
              title="Salir de la Demo"
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto hidden md:block py-4">
          <ul className={classNames("space-y-2 transition-all duration-300", isCollapsed ? "px-3" : "px-3")}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={classNames(
                      "flex items-center py-2.5 text-[13px] font-semibold rounded-lg transition-colors overflow-hidden",
                      isCollapsed ? "justify-center px-0" : "px-3",
                      isActive ? "bg-rio-gold-light/20 text-rio-gold-dark" : "text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted"
                    )}
                  >
                    <item.icon className={classNames("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={classNames("whitespace-nowrap transition-all duration-300", isCollapsed ? "hidden" : "block")}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={classNames("p-4 hidden md:block mt-auto border-t border-rio-border", isCollapsed ? "px-3 flex justify-center" : "")}>
          <Link
            href="/acceso-rio"
            title={isCollapsed ? "Salir de la Demo" : undefined}
            className={classNames(
              "flex items-center py-2 text-[13px] font-semibold text-rio-danger hover:bg-rio-danger/5 rounded-lg transition-colors",
              isCollapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <LogOut className={classNames("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} strokeWidth={2} />
            <span className={classNames("whitespace-nowrap transition-all duration-300", isCollapsed ? "hidden" : "block")}>
              Salir de la Demo
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-rio-surface border-t border-rio-border z-20 print:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-rio-gold" : "text-rio-muted hover:text-rio-ink"
                )}
              >
                <item.icon className={classNames("w-5 h-5", isActive && "text-rio-gold")} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={classNames("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
