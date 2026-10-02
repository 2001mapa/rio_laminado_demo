'use client';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { saveDraft, loadDraft, clearDraft, addPendingOrder, getPendingOrders, PendingOrder, removePendingOrder } from '@/lib/offlineQueue';
import { RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDemo, CartItem } from '@/lib/DemoContext';
import { Customer, Product } from '@/lib/types';
import { Html5Qrcode } from 'html5-qrcode';
import { addToast } from '@/lib/toast';
import { Search, UserPlus, Camera, X, Plus, Minus, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getExactProductBySku, getPagedCatalog } from '@/app/actions/queries';
import { useRouter } from 'next/navigation';

export default function NuevaVentaPage() {
  const router = useRouter();
  const { customers, products, checkoutSeller, syncPendingOrders } = useDemo();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sellerId, setSellerId] = useState<string>('');
  const [pendingQueue, setPendingQueue] = useState<PendingOrder[]>([]);

  

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [offlineDraftWaiting, setOfflineDraftWaiting] = useState<{cart: any[], clientId?: string} | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
       if (data.user) {
          setSellerId(data.user.id);
          getPendingOrders(data.user.id).then(setPendingQueue);
          
          if (!isDraftLoaded) {
             loadDraft(data.user.id).then(draft => {
                 if (draft && draft.cart && draft.cart.length > 0) {
                     setOfflineDraftWaiting({ cart: draft.cart, clientId: draft.selectedClientId });
                 } else {
                     setIsDraftLoaded(true);
                 }
             });
          }
       } else {
          setIsDraftLoaded(true);
       }
    });
  }, []);

  useEffect(() => {
    if (offlineDraftWaiting && products.length > 0 && customers.length > 0) {
        let allResolved = true;
        const restoredCart = offlineDraftWaiting.cart.map((draftItem: any) => {
           const product = products.find(p => p.id === draftItem.productId);
           if (!product) allResolved = false;
           return product ? { product, quantity: draftItem.quantity, sizes: draftItem.sizes } : null;
        }).filter(Boolean);
        
        let clientResolved = true;
        if (offlineDraftWaiting.clientId) {
           const cust = customers.find(c => c.id === offlineDraftWaiting.clientId);
           if (!cust) clientResolved = false;
        }

        if (allResolved && clientResolved) {
            if (restoredCart.length > 0) {
                setCartItems(restoredCart as any[]);
                if (offlineDraftWaiting.clientId) {
                   const cust = customers.find(c => c.id === offlineDraftWaiting.clientId);
                   if (cust) setSelectedCustomer(cust);
                }
            }
            setOfflineDraftWaiting(null);
            setIsDraftLoaded(true);
        }
    }
  }, [products, customers, offlineDraftWaiting]);

  useEffect(() => {
    // Si offlineDraftWaiting tiene valor, significa que el catálogo no cargó y no hemos podido rehidratar.
    // Prohibimos guardar/sobrescribir para proteger el borrador original de IDB.
    if (!isDraftLoaded || !sellerId || offlineDraftWaiting) return;
    
    if (cartItems.length > 0 || selectedCustomer) {
       const minimalCart = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes }));
       saveDraft({ sellerId, selectedClientId: selectedCustomer?.id, cart: minimalCart, updatedAt: Date.now() });
    } else {
       clearDraft(sellerId);
    }
  }, [cartItems, selectedCustomer, sellerId, isDraftLoaded, offlineDraftWaiting]);

  useEffect(() => {
    const refreshQueue = () => {
      if (sellerId) getPendingOrders(sellerId).then(setPendingQueue);
    };
    window.addEventListener('focus', refreshQueue);
    const interval = setInterval(refreshQueue, 3000);
    return () => {
      window.removeEventListener('focus', refreshQueue);
      clearInterval(interval);
    };
  }, [sellerId]);

  const handleRetry = async (order: PendingOrder) => {
      await syncPendingOrders(order.clientRequestId);
      if (sellerId) getPendingOrders(sellerId).then(setPendingQueue);
  };
  
  const handleDiscard = async (orderId: string) => {
      if (confirm("¿Seguro que deseas descartar este borrador fallido?")) {
         await removePendingOrder(orderId);
         if (sellerId) getPendingOrders(sellerId).then(setPendingQueue);
      }
  };

  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState(1);
  const [scanSizes, setScanSizes] = useState<{size: string, quantity: number}[]>([]);
  const [scanSizeInput, setScanSizeInput] = useState('');
  const [scanSizeQtyInput, setScanSizeQtyInput] = useState(1);
  const [manualSku, setManualSku] = useState("");
  const [skuSuggestions, setSkuSuggestions] = useState<Product[]>([]);
  const [isSearchingSku, setIsSearchingSku] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (manualSku.trim().length >= 1 && !scannedProduct) {
        setIsSearchingSku(true);
        try {
          const res = await getPagedCatalog({ search: manualSku, limit: 5 });
          if (res.success && res.products) {
            setSkuSuggestions(res.products as any);
          }
        } catch(e) {}
        setIsSearchingSku(false);
      } else {
        setSkuSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [manualSku, scannedProduct]);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const scannerRegionId = "qr-reader";

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stop scanner when unmounting or leaving step 2
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const cleanup = async () => {
          try {
             if (scannerRef.current && (scannerRef.current.getState() === 2 || scannerRef.current.getState() === 3)) {
                await scannerRef.current.stop();
             }
          } catch(e) {}
          try { if (scannerRef.current) scannerRef.current.clear(); } catch(e) {}
          scannerRef.current = null;
        };
        cleanup();
      }
    };
  }, []); // <-- Empty array is critical! Only runs on unmount.

    const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    const safeQrbox = (w: number, h: number) => {
      const minEdge = Math.min(w, h);
      if (minEdge === 0) return { width: 250, height: 250 };
      const size = Math.max(150, Math.min(250, minEdge * 0.7));
      return { width: size, height: size };
    };

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerRegionId);
      }

      // Intentar primero con facingMode environment (estándar y más compatible con iOS/Safari)
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: safeQrbox },
        (decodedText) => {
          if (scannerRef.current) { try { scannerRef.current.pause(); } catch(e){} }
          handleScan(decodedText);
        },
        (error) => {}
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner with environment", err);
      // Fallback: listar cámaras e intentar con el primer deviceId disponible
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera') || c.label.toLowerCase().includes('environment'));
          const cameraId = backCamera ? backCamera.id : cameras[0].id;
          
          if(scannerRef.current) await scannerRef.current.start(
            { deviceId: { exact: cameraId } },
            { fps: 10, qrbox: safeQrbox },
            (decodedText) => {
              if (scannerRef.current) { try { scannerRef.current.pause(); } catch(e){} }
              handleScan(decodedText);
            },
            (error) => {}
          );
          setIsScanning(true);
          isStartingRef.current = false;
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback error", fallbackErr);
      }
      addToast("Error de cámara: Asegúrate de dar permisos en el navegador.");
      setIsScanning(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        if (scannerRef.current.getState() === 2 /* SCANNING */ || scannerRef.current.getState() === 3 /* PAUSED */) {
           await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn("Ignored error while stopping scanner:", err);
      } finally {
        try { scannerRef.current.clear(); } catch(e) {}
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleScan = async (sku: string) => {
    try {
      const result = await getExactProductBySku(sku);
      
      if (result.success && result.product) {
        setScannedProduct(result.product as Product);
        setScanQuantity(1);
        setScanSizes([]);
        setScanSizeInput('');
        setScanSizeQtyInput(1);
        try {
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          audio.volume = 0.5;
          audio.play();
        } catch(e) {}
      } else {
        addToast(result.error || `SKU no encontrado: ${sku}`);
        if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
      }
    } catch (err) {
      addToast('Error al buscar el producto');
      if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
    }
  };

  const confirmScan = () => {
    if (!scannedProduct) return;
    
    const isAnillo = scannedProduct.category === 'Anillos';
    const totalAnilloQty = scanSizes.reduce((acc, s) => acc + s.quantity, 0);
    const sumOfSizes = isAnillo ? totalAnilloQty : scanQuantity;

    if (isAnillo && sumOfSizes === 0) {
      addToast('Debes agregar al menos una talla');
      return;
    }
    
    const availableStock = scannedProduct.physicalStock - scannedProduct.reservedStock;
    const existingItem = cartItems.find(item => item.product.id === scannedProduct.id);
    const existingQty = existingItem ? existingItem.quantity : 0;
    
    if (existingQty + sumOfSizes > availableStock) {
       addToast(`Supera el límite. Solo puedes agregar ${availableStock - existingQty} unidades más.`);
       return;
    }
    
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === scannedProduct.id);
      if (existing) {
        return prev.map(item => {
          if (item.product.id === scannedProduct.id) {
            let updatedSizes = item.sizes || [];
            
            if (isAnillo && scanSizes.length > 0) {
              const combinedSizes = [...updatedSizes];
              scanSizes.forEach(newSize => {
                const existingSizeIndex = combinedSizes.findIndex(s => s.size === newSize.size);
                if (existingSizeIndex >= 0) {
                  combinedSizes[existingSizeIndex] = { ...combinedSizes[existingSizeIndex], quantity: combinedSizes[existingSizeIndex].quantity + newSize.quantity };
                } else {
                  combinedSizes.push(newSize);
                }
              });
              updatedSizes = combinedSizes;
            }
            
            return { 
              ...item, 
              quantity: item.quantity + sumOfSizes,
              sizes: isAnillo ? updatedSizes : item.sizes
            };
          }
          return item;
        });
      }
      return [...prev, { 
        product: scannedProduct, 
        quantity: sumOfSizes,
        sizes: isAnillo ? scanSizes : undefined,
        clearCart: () => {},
        addOrder: async () => {},
        updateOrder: () => {},
        transitionOrder: async () => {},
        acknowledgeAdjustment: async () => {},
        updateCustomer: () => {},
        addSeller: () => {},
        checkoutSeller: async () => {},
        refreshData: async () => {}
      }];
    });
    
    addToast(`Unidades de ${scannedProduct.name} actualizadas.`);
    setScannedProduct(null);
    
    if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
  };

  const cancelScan = () => {
    setScannedProduct(null);
    if (scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
  };

  const handleCheckout = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    setIsCheckingOut(true);
    
    for (const item of cartItems) {
      const isAnillo = item.product.category === 'Anillos';
      const availableStock = item.product.physicalStock - item.product.reservedStock;
      if (item.quantity > availableStock) {
        addToast(`El producto ${item.product.name} excede el stock disponible. Máximo: ${availableStock}`);
        setIsCheckingOut(false);
        return;
      }
      if (isAnillo) {
        const sumOfSizes = item.sizes?.reduce((a, b) => a + b.quantity, 0) || 0;
        if (sumOfSizes !== item.quantity) {
          addToast(`Las tallas de ${item.product.name} suman ${sumOfSizes} pero la cantidad total es ${item.quantity}. Deben coincidir.`);
          setIsCheckingOut(false);
          return;
        }
      }
    }

    
    const clientRequestId = uuidv4();
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    const pendingOrder: PendingOrder = {
      clientRequestId,
      sellerId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        sizeDetails: item.sizes,
      })),
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      totalAmount
    };

    try {
      await addPendingOrder(pendingOrder);
      await clearDraft(sellerId);
      setCartItems([]);
      setStep(1);
      setSelectedCustomer(null);
      setPendingQueue(prev => [...prev, pendingOrder]);
      addToast("Borrador guardado localmente.");
      
      if (navigator.onLine) {
        const res = await checkoutSeller(pendingOrder.customerId!, cartItems, clientRequestId);
        if (res.success) {
           await removePendingOrder(clientRequestId);
           setPendingQueue(prev => prev.filter(p => p.clientRequestId !== clientRequestId));
           addToast("Venta confirmada: " + (res.order?.orderNumber || ''));
        } else {
           addToast("No se pudo confirmar de inmediato, reintentando en segundo plano.");
        }
      } else {
        addToast("Sin conexión. El pedido está en cola y se enviará automáticamente al recuperar la red.");
      }
    } catch(err) {
      console.error(err);
      addToast("Error guardando el borrador local");
    } finally {
      setIsCheckingOut(false);
    }
    return;

    setIsCheckingOut(false);
  };

  const updateCartItemQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const available = item.product.physicalStock - item.product.reservedStock;
        const newQuantity = Math.max(1, Math.min(available, item.quantity + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };
  
  const removeCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const removeCartItemSize = (productId: string, sizeName: string) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId && item.sizes) {
        const removedSize = item.sizes.find(s => s.size === sizeName);
        if (!removedSize) return item;
        const newSizes = item.sizes.filter(s => s.size !== sizeName);
        const newQuantity = Math.max(0, item.quantity - removedSize.quantity);
        return { ...item, sizes: newSizes, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0)); // Auto-remove if quantity falls to 0
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cartItems.length;

  return (
    <div className="min-h-screen bg-rio-background md:h-screen md:overflow-hidden flex flex-col pt-4">
      {step === 1 && (
        <div className="flex-1 max-w-md w-full mx-auto px-4 pb-24 space-y-6 animate-fade-in overflow-y-auto">
          
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-serif font-black text-rio-ink">Nueva Venta</h1>
              <p className="text-sm text-rio-muted font-medium">Selecciona el cliente a facturar.</p>
            </div>

            {offlineDraftWaiting && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3 shadow-sm text-left">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Requiere recargar catálogo</p>
                  <p className="text-sm mt-1">Tienes una venta guardada con productos o clientes que aún no se han cargado en el dispositivo. Conéctate a internet para restaurarla de forma segura. Tus datos locales están a salvo.</p>
                </div>
              </div>
            )}

            {pendingQueue.length > 0 && (
              <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm text-left">
                <h2 className="font-bold text-rio-ink flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-amber-500" /> Cola de Envíos ({pendingQueue.length})
                </h2>
                <div className="space-y-3">
                  {pendingQueue.map(order => (
                    <div key={order.clientRequestId} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm relative">
                      <p className="font-medium text-gray-800">{order.customerName}</p>
                      <p className="text-gray-500 text-xs mt-1">Estado: <span className="font-semibold text-amber-600">{
                        order.status === 'pending' ? 'Pendiente de conexión' : 
                        order.status === 'syncing' ? 'Sincronizando...' : 
                        order.status === 'failed_recoverable' ? 'Reintentando (Red)...' : 
                        order.status === 'failed_intervention' ? 'Requiere verificar con servidor' : 
                        'Requiere revisión'
                      }</span></p>
                      {order.lastError && <p className="text-xs text-red-500 mt-1">{order.lastError}</p>}
                      <div className="mt-2 flex gap-2">
                        {(order.status === 'failed_fatal' || order.status === 'failed_intervention' || order.status === 'failed_recoverable') && (
                          <button onClick={() => handleRetry(order)} className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Reintentar
                          </button>
                        )}
                        {order.status === 'failed_fatal' && (
                          <button onClick={() => handleDiscard(order.clientRequestId)} className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-100">
                            Descartar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rio-muted" />
            <input 
              type="text"
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-rio-border rounded-xl py-3.5 pl-12 pr-4 text-[13px] focus:outline-none focus:border-rio-gold-dark focus:ring-1 focus:ring-rio-gold-dark transition-all shadow-sm"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-rio-muted uppercase tracking-wider px-2">Clientes Disponibles</p>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 bg-rio-surface-muted rounded-2xl border border-rio-border border-dashed">
                <p className="text-[13px] text-rio-muted font-medium">No se encontraron clientes.</p>
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => { setSelectedCustomer(customer); setStep(2); }}
                  className="w-full bg-white p-4 rounded-2xl border border-rio-border text-left hover:border-rio-gold-light hover:shadow-md transition-all group flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-rio-ink text-sm group-hover:text-rio-gold-dark transition-colors">{customer.name}</p>
                    <p className="text-xs text-rio-muted mt-1">{customer.email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-rio-background flex items-center justify-center group-hover:bg-rio-gold-light/20 transition-colors">
                    <Plus className="w-4 h-4 text-rio-gold-dark" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 pb-24 md:pb-6 flex flex-col md:flex-row gap-6 h-full animate-fade-in overflow-hidden">
          
          <div className="w-full md:flex-1 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-lg text-rio-ink">Escáner de Productos</h2>
              <button onClick={() => { stopScanner(); setStep(1); }} className="text-xs font-bold text-rio-gold-dark hover:underline">
                Cambiar Cliente
              </button>
            </div>

            <div className="flex-1 bg-white border border-rio-border rounded-2xl overflow-hidden relative shadow-sm flex flex-col">
              <div className="p-4 border-b border-rio-border bg-rio-surface flex items-center justify-between z-20 shrink-0">
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-rio-muted">Cliente Seleccionado</p>
                  <p className="font-bold text-sm text-rio-ink truncate">{selectedCustomer?.name}</p>
                </div>
              </div>

              <div className="p-4 border-b border-rio-border bg-white z-20 shrink-0">
                <div className="relative">
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (manualSku.trim()) {
                      setSkuSuggestions([]);
                      handleScan(manualSku);
                      setManualSku("");
                    }
                  }}
                  className="flex gap-2 relative z-50"
                >
                  <input 
                    type="text"
                    placeholder="Ingresar SKU manualmente"
                    value={manualSku}
                    onChange={e => setManualSku(e.target.value)}
                    className="flex-1 bg-rio-background border border-rio-border rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-rio-gold-dark"
                  />
                  <button type="submit" className="bg-rio-ink text-white px-4 py-2.5 rounded-xl font-bold text-[13px] hover:bg-rio-ink/80 transition-colors">
                    Buscar
                  </button>
                </form>

                {(isSearchingSku || skuSuggestions.length > 0) && manualSku.trim().length > 0 && !scannedProduct && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-rio-border z-[100] max-h-60 overflow-y-auto animate-fade-in">
                    {isSearchingSku && skuSuggestions.length === 0 && (
                      <div className="p-4 text-center text-sm text-rio-muted font-medium">
                        Buscando referencias...
                      </div>
                    )}
                    {!isSearchingSku && skuSuggestions.length === 0 && manualSku.trim().length > 2 && (
                      <div className="p-4 text-center text-sm text-rio-muted font-medium">
                        No se encontraron coincidencias
                      </div>
                    )}
                    {skuSuggestions.map(p => (
                      <button 
                        key={p.id} 
                        type="button"
                        onClick={() => {
                           setManualSku("");
                           setSkuSuggestions([]);
                           handleScan(p.sku);
                        }}
                        className="w-full text-left px-4 py-3 border-b border-rio-border/50 hover:bg-rio-surface transition-colors flex items-center justify-between last:border-0"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="text-[10px] text-rio-muted font-mono mb-0.5">{p.sku}</p>
                          <p className="text-xs font-bold text-rio-ink truncate">{p.name}</p>
                        </div>
                        <span className="text-xs font-bold text-rio-gold-dark shrink-0">{formatPrice(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>

              <div className="flex-1 relative bg-black flex flex-col">
                <style>{`
                  #qr-reader { width: 100%; height: 100%; border: none !important; }
                  #qr-reader video { width: 100% !important; height: 100% !important; object-fit: contain !important; }
                  #qr-reader__dashboard_section_csr { display: none !important; }
                `}</style>
                
                <div id={scannerRegionId} className="w-full h-full absolute inset-0 z-0"></div>
                
                {!isScanning ? (
                  <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white z-10 p-6 text-center">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-semibold text-sm mb-4">Cámara lista para escanear</p>
                    <button 
                      onClick={startScanner}
                      className="bg-white text-black font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform"
                    >
                      Activar Lector QR
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={stopScanner}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-4 py-2 rounded-full z-20 border border-white/20"
                  >
                    Pausar Cámara
                  </button>
                )}

                {scannedProduct && (
                  <div className="absolute inset-0 bg-white z-40 flex flex-col p-4 sm:p-6 overflow-y-auto animate-zoom-in">
                    <button onClick={cancelScan} className="absolute top-3 right-3 text-rio-muted hover:text-rio-ink p-2 bg-rio-background rounded-full transition-colors">
                      <X className="w-5 h-5"/>
                    </button>
                    
                    <div className="flex gap-4 items-center mb-6 border-b border-rio-border pb-4 pr-10">
                        {scannedProduct.imageUrl ? (
                           <img src={scannedProduct.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-rio-border shrink-0" />
                        ) : (
                           <div className="w-16 h-16 rounded-xl bg-rio-background flex items-center justify-center border border-rio-border shrink-0 text-rio-muted font-medium text-xs">Sin Foto</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-rio-muted font-mono mb-1">{scannedProduct.sku}</p>
                          <h3 className="font-bold text-rio-ink text-sm leading-tight mb-1">{scannedProduct.name}</h3>
                          <p className="text-rio-gold-dark font-black">{formatPrice(scannedProduct.price)}</p>
                            <div className="mt-1.5 flex items-center">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-rio-success/10 text-rio-success border border-rio-success/20">
                                {scannedProduct.physicalStock - scannedProduct.reservedStock} disponibles
                              </span>
                            </div>
                          </div>
                        </div>

                      {scannedProduct.category === 'Anillos' ? (
                        <div className="mb-6">
                          <p className="text-xs font-bold text-rio-ink mb-3 text-center uppercase tracking-wider">Tallas Solicitadas</p>
                          
                          <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="Talla" value={scanSizeInput} onChange={e => setScanSizeInput(e.target.value)} className="flex-1 min-w-0 bg-rio-background border border-rio-border rounded-xl px-3 py-2 text-sm focus:outline-none" />
                            <input type="number" min="1" value={scanSizeQtyInput} onChange={e => setScanSizeQtyInput(parseInt(e.target.value) || 1)} className="w-16 shrink-0 bg-rio-background border border-rio-border rounded-xl px-2 py-2 text-sm text-center focus:outline-none" />
                            <button onClick={() => {
                              if(scanSizeInput.trim() && scanSizeQtyInput > 0) {
                                const currentTotal = scanSizes.reduce((acc, s) => acc + s.quantity, 0);
                                const availableStock = scannedProduct.physicalStock - scannedProduct.reservedStock;
                                const cartExisting = cartItems.find(i => i.product.id === scannedProduct.id);
                                const inCartQty = cartExisting ? cartExisting.quantity : 0;
                                const remainingStock = availableStock - inCartQty;
                                
                                if (currentTotal + scanSizeQtyInput > remainingStock) {
                                  window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: `Solo quedan ${remainingStock} unidades disponibles.`, type: 'error' } }));
                                  return;
                                }

                                const isDuplicate = scanSizes.some(s => s.size === scanSizeInput.trim());
                                if (isDuplicate) {
                                  setScanSizes(prev => prev.map(s => s.size === scanSizeInput.trim() ? {...s, quantity: s.quantity + scanSizeQtyInput} : s));
                                } else {
                                  setScanSizes([...scanSizes, {size: scanSizeInput.trim(), quantity: scanSizeQtyInput}]);
                                }
                                setScanSizeInput(''); setScanSizeQtyInput(1);
                              }
                            }} className="bg-rio-ink text-white p-2 rounded-xl">
                              <Plus className="w-5 h-5"/>
                            </button>
                          </div>

                          {scanSizes.length > 0 && (
                            <div className="bg-rio-surface-muted rounded-xl p-3 border border-rio-border max-h-[120px] overflow-y-auto">
                              <div className="flex flex-wrap gap-2">
                                {scanSizes.map((s, idx) => (
                                  <div key={idx} className="flex items-center gap-1 bg-white border border-rio-border px-2 py-1 rounded-lg text-xs">
                                    <span className="font-medium text-rio-ink">T{s.size}</span>
                                    <span className="text-rio-muted">x{s.quantity}</span>
                                    <button onClick={() => setScanSizes(scanSizes.filter(ss => ss.size !== s.size))} className="ml-0.5 text-rio-danger hover:opacity-80">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-rio-ink mb-2 text-center uppercase tracking-wider">Cantidad Solicitada</p>
                          <div className="flex items-center justify-center gap-4 mb-6">
                            <button onClick={() => setScanQuantity(Math.max(1, scanQuantity - 1))} className="w-12 h-12 rounded-full bg-rio-surface-muted flex items-center justify-center hover:bg-rio-border active:scale-95 transition-all text-rio-ink disabled:opacity-50" disabled={(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0}>
                              <Minus className="w-5 h-5"/>
                            </button>
                            <input 
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={scanQuantity === 0 ? '' : scanQuantity}
                              disabled={(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                let newQuantity = isNaN(val) ? 0 : val;
                                if (newQuantity > (scannedProduct.physicalStock - scannedProduct.reservedStock)) newQuantity = (scannedProduct.physicalStock - scannedProduct.reservedStock);
                                setScanQuantity(newQuantity);
                              }}
                              onBlur={() => {
                                if (scanQuantity < 1 && (scannedProduct.physicalStock - scannedProduct.reservedStock) > 0) setScanQuantity(1);
                                if (scanQuantity > (scannedProduct.physicalStock - scannedProduct.reservedStock)) setScanQuantity((scannedProduct.physicalStock - scannedProduct.reservedStock));
                              }}
                              className="text-3xl font-black w-16 text-center bg-transparent border-none outline-none focus:ring-0 p-0 m-0 text-rio-ink disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => setScanQuantity(Math.min((scannedProduct.physicalStock - scannedProduct.reservedStock), scanQuantity + 1))} className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all text-white shadow-md disabled:bg-rio-border disabled:text-rio-muted disabled:shadow-none" disabled={scanQuantity >= (scannedProduct.physicalStock - scannedProduct.reservedStock) || (scannedProduct.physicalStock - scannedProduct.reservedStock) === 0}>
                              <Plus className="w-5 h-5"/>
                            </button>
                          </div>
                        </>
                      )}

                      <div className="mt-auto pt-2">
                        <button 
                          onClick={confirmScan} 
                          disabled={(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0}
                          className="w-full bg-rio-ink disabled:bg-rio-border disabled:text-rio-muted text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                        >
                          {(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0 ? 'Sin Inventario' : 'Agregar a la Orden'}
                        </button>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-[450px] shrink-0 md:pl-6 md:border-l md:border-rio-border flex flex-col h-[50vh] md:h-full">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rio-gold-dark"/>
                <h2 className="font-serif font-bold text-lg text-rio-ink">Pedido Actual</h2>
              </div>
              <span className="bg-rio-surface-muted px-2 py-1 rounded-full text-[11px] font-bold text-rio-ink">{totalItems} refs</span>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden border border-rio-border rounded-xl bg-rio-background/50 p-2 space-y-2 mb-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-rio-muted p-6 text-center">
                  <ShoppingBag className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-medium">El pedido está vacío.<br/>Escanea prendas para comenzar.</p>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <div key={index} className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-rio-border shadow-sm group">
                    <div className="flex gap-3 items-start">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-rio-border shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-rio-background flex items-center justify-center border border-rio-border shrink-0 text-rio-muted font-medium text-[10px]">Sin foto</div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-rio-muted font-mono leading-none mb-1 truncate">{item.product.sku}</p>
                            <p className="text-xs font-bold text-rio-ink truncate pr-2">{item.product.name}</p>
                          </div>
                          <button onClick={() => removeCartItem(item.product.id)} className="text-rio-muted hover:text-rio-danger hover:bg-rio-danger/10 p-1.5 shrink-0 bg-rio-surface-muted rounded-md transition-all active:scale-95">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs font-bold text-rio-gold-dark">{formatPrice(item.product.price * item.quantity)}</p>
                          
                          {item.product.category !== 'Anillos' && (
                            <div className="flex items-center bg-rio-background border border-rio-border rounded-lg overflow-hidden">
                              <button onClick={() => updateCartItemQuantity(item.product.id, -1)} className="px-2 py-1 text-rio-ink hover:bg-rio-border transition-colors"><Minus className="w-3 h-3" /></button>
                              <span className="text-[11px] font-bold w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateCartItemQuantity(item.product.id, 1)} className="px-2 py-1 text-rio-ink hover:bg-rio-border transition-colors"><Plus className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {item.product.category === 'Anillos' && item.sizes && (
                      <div className="mt-2 pt-2 border-t border-rio-border/50">
                        <div className="flex flex-wrap gap-1.5">
                          {item.sizes.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-rio-background border border-rio-border px-1.5 py-1 rounded-md text-[10px]">
                              <span className="font-bold text-rio-ink">T{s.size}</span>
                              <span className="text-rio-muted">x{s.quantity}</span>
                              <button onClick={() => removeCartItemSize(item.product.id, s.size)} className="ml-0.5 text-rio-danger hover:opacity-80">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border border-rio-border rounded-xl bg-white p-4 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-rio-muted font-bold uppercase tracking-wider">Total ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} uds)</span>
                <span className="text-2xl font-black text-rio-ink">{formatPrice(totalAmount)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || !selectedCustomer || isCheckingOut}
                className="w-full bg-rio-gold-dark disabled:bg-rio-border disabled:text-rio-muted text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-rio-gold active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isCheckingOut ? "Procesando..." : "Finalizar Venta"} <Check className="w-5 h-5 ml-2"/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
