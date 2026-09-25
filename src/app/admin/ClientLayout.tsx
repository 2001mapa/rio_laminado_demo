'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Inbox, PackageSearch, Users, LogOut, ChevronLeft, ChevronRight, Menu, Store, Bell, BellOff, History } from 'lucide-react';
import { classNames } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { getAdminLatestOrderIds } from '@/app/actions/queries';
import { useDemo } from '@/lib/DemoContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { orders, refreshData } = useDemo();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(false);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const [newOrderAlerts, setNewOrderAlerts] = useState<{id: string, number: string}[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || session.user.user_metadata?.role !== 'admin') {
        console.log('[Layout Admin] No session or wrong role');
        router.push('/login');
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  let audioCtxRef = useRef<any>(null);
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    const val = localStorage.getItem('admin-sound-enabled');
    if (val === 'true') setSoundEnabled(true);
  }, []);

  const playNotificationSound = (force = false) => {
    if (!force && localStorage.getItem('admin-sound-enabled') !== 'true') return;
    try {
      const audioCtx = getAudioCtx();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
         audioCtx.resume().catch(() => {});
      }
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio play blocked or not supported');
    }
  };

  const toggleSound = async () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('admin-sound-enabled', newVal.toString());
    
    if (newVal) {
      try {
        const audioCtx = getAudioCtx();
        if (audioCtx && audioCtx.state === 'suspended') {
           await audioCtx.resume();
        }
        playNotificationSound(true);
      } catch (err) {
        alert('El navegador bloqueó el audio. El aviso visual seguirá funcionando.');
      }
    }
  };

  // 1. Initial baseline fetch on mount
  useEffect(() => {
    if (!isAuthorized) return;
    
    const initBaseline = async () => {
      try {
        const res = await getAdminLatestOrderIds();
        if (res.success && res.orders) {
          knownOrderIdsRef.current = new Set((res.orders as any[]).map(o => o.id));
        } else {
          knownOrderIdsRef.current = new Set();
        }
      } catch (e) {
        console.error('Error inicializando IDs base:', e);
        knownOrderIdsRef.current = new Set(); // start empty if fail, better than crashing
      }
    };
    initBaseline();
  }, [isAuthorized]);

  // 2. Stable polling and focus check
  useEffect(() => {
    if (!isAuthorized) return;
    
    let isPolling = false;
    const checkNewOrders = async () => {
      if (document.hidden || isPolling || !knownOrderIdsRef.current) return;
      isPolling = true;
      try {
        const res = await getAdminLatestOrderIds();
        if (res.success && res.orders) {
          const fetchedOrders = res.orders as any[];
          const currentKnown = knownOrderIdsRef.current;
          const incomingNewOrders = fetchedOrders.filter(o => !currentKnown.has(o.id));
          
          if (incomingNewOrders.length > 0) {
             incomingNewOrders.forEach(o => currentKnown.add(o.id));
             
             await refreshData();
             setNewOrderAlerts(prev => [...prev, ...incomingNewOrders]);
             playNotificationSound();
          }
        }
      } catch (e) {
        console.error("Error diagnosticando pedidos nuevos. Se reintentará...", e);
      } finally {
        isPolling = false;
      }
    };

    const intervalId = setInterval(checkNewOrders, 15000);
    
    const handleFocus = () => {
      if (!document.hidden) checkNewOrders();
    };
    
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthorized, refreshData]);

  if (!isAuthorized) return <div className="min-h-screen bg-rio-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-rio-gold border-t-transparent rounded-full animate-spin"></div></div>;
  
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/admin/pedidos', icon: Inbox, badge: newOrderAlerts.length },
    { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Vendedores', href: '/admin/vendedores', icon: Store },
    { name: 'Historial', href: '/admin/historial', icon: History },
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-rio-background flex flex-col md:flex-row font-sans pb-20 md:pb-0 relative print:min-h-0 print:h-auto print:overflow-visible print:pb-0 print:bg-white">
      
      {newOrderAlerts.length > 0 && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col gap-3 pointer-events-none">
          {newOrderAlerts.map(alert => (
            <div key={alert.id} className="bg-white border border-rio-success shadow-2xl rounded-2xl p-4 w-72 flex items-start justify-between pointer-events-auto animate-slide-up relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-rio-success"></div>
              <div>
                <h3 className="text-sm font-bold text-rio-ink mb-1">¡Nuevo Pedido!</h3>
                <p className="text-xs text-rio-muted mb-3">Se ha recibido el pedido <strong>{alert.number}</strong></p>
                <div className="flex gap-2">
                  <Link 
                    href={`/admin/pedidos/${alert.id}`}
                    onClick={() => setNewOrderAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    className="bg-rio-success/10 hover:bg-rio-success/20 text-rio-success text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Ver Pedido
                  </Link>
                  <button 
                    onClick={() => setNewOrderAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    className="text-rio-muted hover:text-rio-ink text-[11px] font-bold px-2 py-1.5 transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar Desktop / Topbar Mobile */}
      <aside className={classNames(
        "w-full bg-rio-ink text-white flex flex-col md:h-screen shrink-0 border-r border-black print:hidden transition-all duration-300",
        isCollapsed ? "md:w-20" : "md:w-60"
      )}>
        <div className={classNames("p-4 md:p-6 flex items-center justify-between border-b border-white/10", isCollapsed ? "md:justify-center md:px-0" : "md:justify-start")}>
          <div className={classNames("overflow-hidden transition-all duration-300 flex-1", isCollapsed ? "md:hidden" : "")}>
            <h1 className="font-serif font-bold text-xl tracking-widest text-white whitespace-nowrap">RIO</h1>
            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5 font-bold whitespace-nowrap">Bodega B2B</p>
          </div>
          
          <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className={classNames("hidden md:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white shrink-0", isCollapsed ? "" : "ml-auto")}
             aria-label="Toggle Sidebar"
          >
             {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2 md:hidden">
            <button 
              onClick={toggleSound}
              className="p-2 text-white/40 hover:text-white transition-colors"
              title={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
            >
              {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} 
              className="p-2 -mr-2 text-white/40 hover:text-white transition-colors flex items-center"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto hidden md:block py-4">
          <ul className={classNames("space-y-1 transition-all duration-300", isCollapsed ? "px-2" : "px-3")}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={classNames(
                      "flex items-center py-2.5 text-[13px] font-semibold rounded-lg transition-all overflow-hidden relative",
                      isCollapsed ? "justify-center px-0" : "px-3",
                      isActive ? "bg-white/15 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={classNames("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} strokeWidth={isActive ? 2.5 : 1.5} />
                      {item.badge ? (
                        <span className="absolute -top-1 -right-1 bg-rio-success text-white text-[9px] font-black min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-rio-ink leading-none">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    
                    <span className={classNames("whitespace-nowrap transition-all duration-300", isCollapsed ? "hidden" : "block")}>
                      {item.name}
                    </span>
                    {isActive && !isCollapsed && <div className="ml-auto w-1 h-4 rounded-full bg-rio-gold" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={classNames("p-4 hidden md:block border-t border-white/10 space-y-2", isCollapsed ? "px-2" : "")}>
          <button
            onClick={toggleSound}
            className={classNames(
              "w-full flex items-center py-2 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/8 rounded-lg transition-all",
              isCollapsed ? "justify-center px-0" : "px-3"
            )}
            title={isCollapsed ? (soundEnabled ? "Desactivar sonido" : "Activar sonido") : undefined}
          >
            {soundEnabled ? (
              <Bell className={classNames("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} strokeWidth={1.5} />
            ) : (
              <BellOff className={classNames("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} strokeWidth={1.5} />
            )}
            <span className={classNames("whitespace-nowrap transition-all duration-300", isCollapsed ? "hidden" : "block")}>
              {soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
            </span>
          </button>
          
          <button onClick={handleLogout} 
            title={isCollapsed ? "Salir" : undefined}
            className={classNames(
              "w-full flex items-center py-2 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/8 rounded-lg transition-all",
              isCollapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <LogOut className={classNames("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} strokeWidth={1.5} />
            <span className={classNames("whitespace-nowrap transition-all duration-300", isCollapsed ? "hidden" : "block")}>
              Salir
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-rio-background print:overflow-visible print:bg-white">
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
                <div className="relative">
                  <item.icon className={classNames("w-5 h-5", isActive && "text-rio-gold")} strokeWidth={isActive ? 2.5 : 1.5} />
                  {item.badge ? (
                    <span className="absolute -top-1 -right-1 bg-rio-success text-white text-[9px] font-black min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-rio-surface leading-none">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={classNames("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
