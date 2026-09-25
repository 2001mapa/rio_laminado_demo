'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ScanLine, User, LogOut, Bell, BellOff, Package } from 'lucide-react';
import { classNames } from '@/lib/utils';
import ToastContainer from '@/components/ToastContainer';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState, useRef } from 'react';
import { getSellerOrderStates } from '@/app/actions/queries';
import { useDemo } from '@/lib/DemoContext';
import { addToast } from '@/lib/toast';

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { refreshData } = useDemo();
  
  const [soundEnabled, setSoundEnabled] = useState(false);
  const knownStatesRef = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const role = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role;
      if (!session || role !== 'vendedor') {
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
    const val = localStorage.getItem('vendedor-sound-enabled');
    if (val === 'true') setSoundEnabled(true);
  }, []);

  const playNotificationSound = (force = false) => {
    if (!force && localStorage.getItem('vendedor-sound-enabled') !== 'true') return;
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
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // C5ish
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1); 
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio play blocked or not supported');
    }
  };

  const toggleSound = async () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('vendedor-sound-enabled', newVal.toString());
    
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
        const res = await getSellerOrderStates();
        if (res.success && res.orders) {
          const map: Record<string, string> = {};
          (res.orders as any[]).forEach(o => {
            map[o.id] = o.status;
          });
          knownStatesRef.current = map;
        } else {
          knownStatesRef.current = {};
        }
      } catch (e) {
        knownStatesRef.current = {}; 
      }
    };
    initBaseline();
  }, [isAuthorized]);

  // 2. Stable polling and focus check
  useEffect(() => {
    if (!isAuthorized) return;
    
    let isPolling = false;
    const checkOrderChanges = async () => {
      if (document.hidden || isPolling || !knownStatesRef.current) return;
      isPolling = true;
      try {
        const res = await getSellerOrderStates();
        if (res.success && res.orders) {
          const fetchedOrders = res.orders as any[];
          const currentKnown = knownStatesRef.current;
          let changed = false;

          fetchedOrders.forEach(o => {
            const oldStatus = currentKnown[o.id];
            if (oldStatus && oldStatus !== o.status) {
              changed = true;
              currentKnown[o.id] = o.status;
              
              if (o.status === 'Despachado') {
                addToast(`¡Pedido despachado! #${o.number} va en camino.`);
                playNotificationSound();
              } else {
                addToast(`El pedido #${o.number} ahora está: ${o.status}`);
              }
            } else if (!oldStatus) {
              // New order (created by this seller just now probably)
              currentKnown[o.id] = o.status;
            }
          });
          
          if (changed) {
             await refreshData();
          }
        }
      } catch (e) {
        console.error("Error diagnosticando pedidos nuevos del vendedor. Se reintentará...", e);
      } finally {
        isPolling = false;
      }
    };

    const intervalId = setInterval(checkOrderChanges, 15000);
    
    const handleFocus = () => {
      if (!document.hidden) checkOrderChanges();
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
    { name: 'Dashboard', href: '/vendedor', icon: LayoutDashboard },
    { name: 'Nueva Venta', href: '/vendedor/nueva-venta', icon: ScanLine },
    { name: 'Perfil', href: '/vendedor/perfil', icon: User },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

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

        <div className="flex justify-end md:w-1/3 items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 text-rio-muted hover:text-rio-ink transition-colors flex items-center rounded-xl hover:bg-rio-surface-muted"
            title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
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
