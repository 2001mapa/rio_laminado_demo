'use client';

import { useState, useEffect, useRef } from 'react';
import { useDemo, CartItem } from '@/lib/DemoContext';
import { Customer, Product } from '@/lib/types';
import { Html5Qrcode } from 'html5-qrcode';
import { addToast } from '@/lib/toast';
import { Search, UserPlus, Camera, X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function NuevaVentaPage() {
  const router = useRouter();
  const { customers, products, checkoutSeller } = useDemo();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState(1);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = "qr-reader";

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stop scanner when unmounting or leaving step 2
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const startScanner = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerRegionId);
    }
    
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Pause scanning to process
          if (scannerRef.current) {
            scannerRef.current.pause();
          }
          handleScan(decodedText);
        },
        (error) => {
          // Ignore frequent scanning errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner", err);
      addToast("Error al acceder a la cámara. Revisa los permisos.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleScan = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    if (product) {
      setScannedProduct(product);
      setScanQuantity(1);
      // Play a beep sound
      try {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.volume = 0.5;
        audio.play();
      } catch(e) {}
    } else {
      addToast(`SKU no encontrado: ${sku}`);
      if (scannerRef.current) scannerRef.current.resume();
    }
  };

  const confirmScan = () => {
    if (!scannedProduct) return;
    
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === scannedProduct.id);
      if (existing) {
        return prev.map(item => item.product.id === scannedProduct.id 
          ? { ...item, quantity: item.quantity + scanQuantity } 
          : item);
      }
      return [...prev, { product: scannedProduct, quantity: scanQuantity }];
    });
    
    addToast(`${scanQuantity}x ${scannedProduct.name} agregados.`);
    setScannedProduct(null);
    
    // Resume scanner
    if (scannerRef.current) scannerRef.current.resume();
  };

  const cancelScan = () => {
    setScannedProduct(null);
    if (scannerRef.current) scannerRef.current.resume();
  };

  const handleCheckout = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
    }
    
    checkoutSeller(selectedCustomer.id, cartItems);
    addToast('¡Venta registrada con éxito!');
    router.push('/vendedor');
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] md:min-h-0 bg-rio-background pb-16 relative">
      {/* Header Progreso */}
      <div className="bg-white px-4 py-3 border-b border-rio-border flex items-center justify-between sticky top-14 z-20">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-black text-white' : 'bg-rio-success text-white'}`}>
            {step === 2 ? <Check className="w-3 h-3" /> : '1'}
          </div>
          <div className="h-0.5 w-4 bg-rio-border"></div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-black text-white' : 'bg-rio-surface-muted text-rio-muted'}`}>
            2
          </div>
        </div>
        <div className="text-xs font-bold text-rio-ink">
          {step === 1 ? 'Seleccionar Cliente' : 'Escanear Artículos'}
        </div>
      </div>

      <div className="flex-1 p-4 bg-white">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-rio-muted" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-rio-border bg-rio-surface-muted text-sm focus:outline-none focus:border-rio-ink focus:ring-1 focus:ring-rio-ink"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="w-full py-3 border-2 border-dashed border-rio-border rounded-xl text-rio-muted hover:text-rio-ink hover:border-rio-ink hover:bg-rio-surface-muted transition-colors flex items-center justify-center font-semibold text-sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Cliente Rápido
            </button>

            <div className="space-y-2 mt-4">
              <h3 className="text-xs font-bold text-rio-muted uppercase tracking-wider mb-2">Resultados ({filteredCustomers.length})</h3>
              {filteredCustomers.map(customer => (
                <div 
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setStep(2);
                  }}
                  className="p-4 rounded-xl border border-rio-border cursor-pointer hover:border-rio-ink transition-colors flex justify-between items-center bg-white shadow-sm"
                >
                  <div>
                    <p className="font-bold text-rio-ink text-sm">{customer.name}</p>
                    <p className="text-[11px] text-rio-muted font-mono mt-0.5">{customer.email}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-rio-border flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-rio-surface-muted"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-full animate-fade-in">
            {/* Customer Info Mini */}
            <div className="flex items-center justify-between mb-4 bg-rio-surface-muted px-3 py-2 rounded-lg border border-rio-border">
              <div>
                <p className="text-[10px] uppercase font-bold text-rio-muted">Cliente</p>
                <p className="font-bold text-sm text-rio-ink truncate max-w-[200px]">{selectedCustomer?.name}</p>
              </div>
              <button onClick={() => { stopScanner(); setStep(1); }} className="text-[11px] font-bold text-rio-gold-dark hover:underline">
                Cambiar
              </button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 min-h-[300px] rounded-2xl overflow-hidden border-2 border-rio-ink/10 relative bg-black flex flex-col items-center justify-center">
              {!isScanning ? (
                <div className="text-center p-6 text-white z-10">
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
                <>
                  <div id={scannerRegionId} className="w-full h-full object-cover"></div>
                  <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-10"></div>
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-lg">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-white absolute top-0 left-0"></div>
                      <div className="w-4 h-4 border-t-2 border-r-2 border-white absolute top-0 right-0"></div>
                      <div className="w-4 h-4 border-b-2 border-l-2 border-white absolute bottom-0 left-0"></div>
                      <div className="w-4 h-4 border-b-2 border-r-2 border-white absolute bottom-0 right-0"></div>
                    </div>
                  </div>
                  <button 
                    onClick={stopScanner}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-4 py-2 rounded-full z-20 border border-white/20"
                  >
                    Pausar Cámara
                  </button>
                </>
              )}

              {/* Scan Modal Overlay */}
              {scannedProduct && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
                    <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted">
                      <p className="font-bold text-sm">Prenda Detectada</p>
                      <button onClick={cancelScan} className="p-1 hover:bg-rio-border rounded-full text-rio-muted hover:text-rio-ink"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-4 items-center mb-6">
                        <img src={scannedProduct.image} className="w-20 h-20 rounded-xl object-cover border border-rio-border shrink-0" alt=""/>
                        <div>
                          <p className="text-[11px] font-mono font-bold text-rio-muted">{scannedProduct.sku}</p>
                          <p className="font-bold text-rio-ink text-sm leading-tight mt-0.5">{scannedProduct.name}</p>
                          <p className="text-rio-gold-dark font-black mt-1">{formatPrice(scannedProduct.price)}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs font-bold text-rio-ink mb-2 text-center uppercase tracking-wider">Cantidad Solicitada</p>
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <button onClick={() => setScanQuantity(Math.max(1, scanQuantity - 1))} className="w-12 h-12 rounded-full bg-rio-surface-muted flex items-center justify-center hover:bg-rio-border active:scale-95 transition-all text-rio-ink">
                          <Minus className="w-5 h-5"/>
                        </button>
                        <span className="text-3xl font-black w-12 text-center">{scanQuantity}</span>
                        <button onClick={() => setScanQuantity(scanQuantity + 1)} className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all text-white shadow-md">
                          <Plus className="w-5 h-5"/>
                        </button>
                      </div>

                      <button onClick={confirmScan} className="w-full bg-black text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                        Agregar a la Orden
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Cart Preview Mobile */}
            <div className="mt-4 border border-rio-border rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-rio-muted"/>
                  <span className="font-bold text-sm text-rio-ink">Pedido en curso</span>
                </div>
                <span className="bg-rio-surface-muted px-2 py-0.5 rounded-full text-[10px] font-bold">{totalItems} refs</span>
              </div>
              
              {cartItems.length === 0 ? (
                <p className="text-xs text-rio-muted text-center py-4 bg-rio-surface-muted rounded-xl border border-dashed border-rio-border">El pedido está vacío. Escanea prendas para comenzar.</p>
              ) : (
                <div className="flex items-center justify-between border-t border-rio-border pt-3 mt-3">
                  <div>
                    <p className="text-[10px] text-rio-muted font-bold uppercase">Total Estimado</p>
                    <p className="text-lg font-black text-rio-ink">{formatPrice(totalAmount)}</p>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="bg-rio-gold-dark text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center text-sm"
                  >
                    Finalizar <Check className="w-4 h-4 ml-2"/>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
