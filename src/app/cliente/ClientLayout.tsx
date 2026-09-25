'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Search, ShoppingBag, User, LogOut, PackageSearch, X } from 'lucide-react';
import { classNames } from '@/lib/utils';
import { useDemo } from '@/lib/DemoContext';
import ToastContainer from '@/components/ToastContainer';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { getClientOrderStatuses, getClientActiveProductsDigest } from '@/app/actions/queries';
import { PUBLIC_STATES, InternalOrderState } from '@/lib/order-status';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, orders, products, currentCustomer, isLoaded, refreshData } = useDemo();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [knownStatuses, setKnownStatuses] = useState<Record<string, string> | null>(null);
  
  // Product updates
  const [knownProductIds, setKnownProductIds] = useState<Set<string> | null>(null);
  const [productStocks, setProductStocks] = useState<Record<string, {p: number, r: number}> | null>(null);
  
  const [statusAlerts, setStatusAlerts] = useState<{id: string, number: string, newPublicStatus: string, message: string, isProductAlert?: boolean}[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'cliente') {
        console.log('[Layout Cliente] No session or wrong role');
        router.push('/login');
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isLoaded && currentCustomer && knownStatuses === null) {
      const initialOrd: Record<string, string> = {};
      const notifiedCache = JSON.parse(localStorage.getItem('rio_notified_orders') || '{}');
      const newAlerts: typeof statusAlerts = [];

      orders.filter(o => o.customerId === currentCustomer.id).forEach(o => {
         const pubStatus = PUBLIC_STATES[o.status as InternalOrderState] || o.status;
         initialOrd[o.id] = pubStatus;

         if (pubStatus === 'Pedido enviado' && notifiedCache[o.id] !== 'Pedido enviado') {
            newAlerts.push({
               id: o.id,
               number: o.number || '',
               newPublicStatus: pubStatus,
               message: `Tu pedido ${o.number} fue enviado`
            });
            notifiedCache[o.id] = pubStatus;
         }
      });
      setKnownStatuses(initialOrd);

      if (newAlerts.length > 0) {
         setStatusAlerts(prev => [...prev, ...newAlerts]);
         localStorage.setItem('rio_notified_orders', JSON.stringify(notifiedCache));
      }

      setKnownProductIds(new Set(products.map(p => p.id)));
      const initialStocks: Record<string, {p: number, r: number}> = {};
      products.forEach(p => { initialStocks[p.id] = { p: p.physicalStock, r: p.reservedStock }; });
      setProductStocks(initialStocks);
    }
  }, [isLoaded, orders, products, currentCustomer, knownStatuses]);

  useEffect(() => {
    if (knownStatuses === null || knownProductIds === null || productStocks === null || !isAuthorized) return;
    
    let isPolling = false;
    const intervalId = setInterval(async () => {
      if (document.hidden || isPolling) return;
      isPolling = true;
      try {
        // 1. Poll orders
        const resOrders = await getClientOrderStatuses();
        let shouldRefresh = false;
        const newAlerts: typeof statusAlerts = [];

        if (resOrders.success && resOrders.orders) {
          const fetchedOrders = resOrders.orders as {id: string, number: string, status: string}[];
          const newStatuses = { ...knownStatuses };
          
          for (const order of fetchedOrders) {
            const publicStatus = PUBLIC_STATES[order.status as InternalOrderState] || order.status;
            const oldPublicStatus = knownStatuses[order.id];
            
            if (oldPublicStatus && oldPublicStatus !== publicStatus) {
              shouldRefresh = true;
              
              let msg = `Tu pedido ${order.number} se ha actualizado a: ${publicStatus}`;
              if (publicStatus === 'Pedido enviado') {
                msg = `Tu pedido ${order.number} fue enviado`;
              } else if (publicStatus === 'Estamos preparando tu pedido') {
                msg = `Estamos preparando tu pedido ${order.number}`;
              }

              newAlerts.push({
                id: order.id,
                number: order.number,
                newPublicStatus: publicStatus,
                message: msg
              });
            }
            newStatuses[order.id] = publicStatus;
          }
          if (shouldRefresh) setKnownStatuses(newStatuses);
        }

        // 2. Poll products
        const resProd = await getClientActiveProductsDigest();
        if (resProd.success && resProd.products) {
          const fetchedP = resProd.products as {id: string, physicalStock: number, reservedStock: number}[];
          let updatedProducts = false;
          let hasNewReferences = false;
          const newStocks = { ...productStocks };
          const newKnownIds = new Set(knownProductIds);

          for (const p of fetchedP) {
             if (!knownProductIds.has(p.id)) {
                hasNewReferences = true;
                updatedProducts = true;
                newKnownIds.add(p.id);
                newStocks[p.id] = { p: p.physicalStock, r: p.reservedStock };
             } else {
                const old = productStocks[p.id];
                if (!old || old.p !== p.physicalStock || old.r !== p.reservedStock) {
                   updatedProducts = true;
                   newStocks[p.id] = { p: p.physicalStock, r: p.reservedStock };
                }
             }
          }
          
          if (updatedProducts) {
             setKnownProductIds(newKnownIds);
             setProductStocks(newStocks);
             shouldRefresh = true;

             if (hasNewReferences) {
                newAlerts.push({
                  id: 'new-products-' + Date.now(),
                  number: 'Catálogo',
                  newPublicStatus: 'Novedad',
                  message: 'Hay nuevos productos en el catálogo.',
                  isProductAlert: true
                });
             }
          }
        }
        
        if (shouldRefresh) {
          await refreshData();
          if (newAlerts.length > 0) {
             setStatusAlerts(prev => [...prev, ...newAlerts]);
             
             // Update localStorage so they don't get re-notified if they reload
             const notifiedCache = JSON.parse(localStorage.getItem('rio_notified_orders') || '{}');
             newAlerts.forEach(a => {
                if (!a.isProductAlert) {
                   notifiedCache[a.id] = a.newPublicStatus;
                }
             });
             localStorage.setItem('rio_notified_orders', JSON.stringify(notifiedCache));
          }
        }
      } catch (e) {
        console.error("Error polling client updates");
      } finally {
        isPolling = false;
      }
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [knownStatuses, knownProductIds, productStocks, isAuthorized, refreshData]);


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
      
      {/* Status Alerts */}
      <div className="fixed bottom-24 left-4 right-4 md:left-auto md:bottom-8 md:right-8 z-[100] flex flex-col gap-3 pointer-events-none md:w-80">
        {statusAlerts.map(alert => (
          <div key={alert.id} className="bg-rio-ink border border-rio-surface-muted shadow-2xl rounded-2xl p-4 flex items-start justify-between pointer-events-auto animate-slide-up relative overflow-hidden">
             <div className="absolute top-0 left-0 bottom-0 w-1 bg-rio-gold-light"></div>
             <div className="flex-1 pr-3">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center">
                  <PackageSearch className="w-4 h-4 mr-2 text-rio-gold-light" />
                  {alert.isProductAlert ? 'Nuevos Productos' : 'Actualización de pedido'}
                </h3>
                <p className="text-[13px] text-white/80 mb-3 leading-tight">{alert.message}</p>
                <Link 
                  href={alert.isProductAlert ? '/cliente' : `/cliente/pedido/${alert.id}`}
                  onClick={() => setStatusAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="inline-block bg-white text-rio-ink text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-rio-surface-muted transition-colors"
                >
                  {alert.isProductAlert ? 'Ver Novedades' : 'Ver Detalle'}
                </Link>
             </div>
             <button 
               onClick={() => setStatusAlerts(prev => prev.filter(a => a.id !== alert.id))}
               className="text-white/40 hover:text-white p-1 transition-colors"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        ))}
      </div>

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
