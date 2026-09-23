const fs = require('fs');
let text = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');

text = text.replace(/import \{ useState, useEffect \} from 'react';/, "import { useState, useEffect, useRef } from 'react';");

const oldCodeStart = "  const [knownOrderIds, setKnownOrderIds] = useState<Set<string> | null>(null);";
const oldCodeEnd = "  if (!isAuthorized) return <div";

const newCode = `  const knownOrderIdsRef = useRef<Set<string> | null>(null);

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

  if (!isAuthorized) return <div`;

const startIndex = text.indexOf(oldCodeStart);
const endIndex = text.indexOf(oldCodeEnd);

if (startIndex !== -1 && endIndex !== -1) {
  text = text.substring(0, startIndex) + newCode + text.substring(endIndex + oldCodeEnd.length);
  fs.writeFileSync('src/app/admin/layout.tsx', text);
  console.log('Success');
} else {
  console.log('Failed to find replace boundaries', startIndex, endIndex);
}
