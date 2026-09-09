'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, PackageSearch, Users, LogOut } from 'lucide-react';
import { classNames } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/admin/pedidos', icon: Inbox },
    { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-rio-background flex flex-col md:flex-row font-sans">
      {/* Sidebar Desktop / Topbar Mobile */}
      <aside className="w-full md:w-64 bg-rio-surface text-rio-ink flex flex-col md:min-h-screen shrink-0 border-r border-rio-border">
        <div className="p-4 md:p-6 flex items-center justify-between md:justify-start">
          <div>
            <h1 className="font-serif font-bold text-2xl tracking-tight text-rio-ink">RIO</h1>
            <p className="text-[10px] text-rio-muted uppercase tracking-widest mt-1 font-bold">Bodega B2B</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-rio-surface-muted text-rio-gold-dark border border-rio-border text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm md:hidden tracking-wider">
              Demo
            </div>
            <Link 
              href="/acceso-rio"
              className="p-2 -mr-2 text-rio-muted hover:text-rio-danger transition-colors flex items-center md:hidden"
              title="Salir de la Demo"
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto hidden md:block py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      "flex items-center px-3 py-2.5 text-[13px] font-semibold rounded-lg transition-colors",
                      isActive ? "bg-rio-gold-light/20 text-rio-gold-dark" : "text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-3 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Nav Header */}
        <div className="md:hidden flex overflow-x-auto bg-rio-surface border-b border-rio-border px-2 py-2 hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  "flex items-center px-4 py-2 text-[12px] font-semibold rounded-full whitespace-nowrap mr-2 transition-colors border",
                  isActive ? "bg-rio-gold-light/20 text-rio-gold-dark border-rio-gold-light/50" : "text-rio-muted bg-rio-surface border-transparent"
                )}
              >
                <item.icon className="w-3.5 h-3.5 mr-2" strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 hidden md:block mt-auto border-t border-rio-border">
          <Link
            href="/acceso-rio"
            className="flex items-center px-3 py-2 text-[13px] font-semibold text-rio-danger hover:bg-rio-danger/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3 shrink-0" strokeWidth={2} />
            Salir de la Demo
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
