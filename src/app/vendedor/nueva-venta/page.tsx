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
  const { customers, products, checkoutSeller, addCustomer } = useDemo();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState(1);
  const [manualSku, setManualSku] = useState("");
  
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  
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
    try {
      // Pedir permisos y listar cámaras primero
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        addToast("No se detectaron cámaras en el dispositivo.");
        return;
      }
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerRegionId);
      }

      // Buscar la cámara trasera si existe, sino usar la por defecto
      const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera') || c.label.toLowerCase().includes('environment'));
      const cameraConfig = backCamera ? { deviceId: { exact: backCamera.id } } : { facingMode: "environment" };
      
      await scannerRef.current.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.pause();
          }
          handleScan(decodedText);
        },
        (error) => {
          // Ignore background scanning errors
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner", err);
      // Fallback para intentar con facingMode directamente si getCameras falló por alguna razón
      if (!isScanning && scannerRef.current) {
         try {
           await scannerRef.current.start(
             { facingMode: "environment" },
             { fps: 10, qrbox: { width: 250, height: 250 } },
             (decodedText) => { if (scannerRef.current) scannerRef.current.pause(); handleScan(decodedText); },
             () => {}
           );
           setIsScanning(true);
           return;
         } catch (fallbackErr) {}
      }
      addToast("Error de cámara: Asegúrate de dar permisos en el navegador.");
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
          ? { ...item, quantity: Math.min((scannedProduct.physicalStock - scannedProduct.reservedStock), item.quantity + scanQuantity) } 
          : item);
      }
      return [...prev, { product: scannedProduct, quantity: Math.min((scannedProduct.physicalStock - scannedProduct.reservedStock), scanQuantity) }];
    });
    
    addToast(`Unidades de ${scannedProduct.name} actualizadas.`);
    setScannedProduct(null);
    
    // Resume scanner
    if (scannerRef.current) scannerRef.current.resume();
  };

  const cancelScan = () => {
    setScannedProduct(null);
    if (scannerRef.current) scannerRef.current.resume();
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      addToast("El nombre del cliente es obligatorio.");
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const newCustomer: Customer = {
      id: tempId,
      username: 'temp_' + tempId,
      name: newCustomerName.trim(),
      email: newCustomerEmail.trim() || `temp_${tempId}@local.test`,
      discount: 0,
      showDiscount: false,
      status: 'active',
      phone: newCustomerPhone.trim() || 'No especificado',
      address: newCustomerAddress.trim() || 'No especificada',
    };
    
    addCustomer(newCustomer);
    addToast(`Cliente ${newCustomer.name} creado.`);
    
    // Auto select
    setSelectedCustomer(newCustomer);
    setShowNewCustomerModal(false);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setStep(2);
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
      <div className="bg-white px-4 py-3 border-b border-rio-border flex items-center justify-between z-20">
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

      <div className="flex-1 p-4 md:p-6 bg-white flex flex-col md:flex-row gap-6">
        
        {/* Left Column (Steps) */}
        <div className="flex-1 max-w-xl">
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

              <button 
                onClick={() => setShowNewCustomerModal(true)}
                className="w-full py-3 border-2 border-dashed border-rio-border rounded-xl text-rio-muted hover:text-rio-ink hover:border-rio-ink hover:bg-rio-surface-muted transition-colors flex items-center justify-center font-semibold text-sm"
              >
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
            <div className="flex flex-col h-[500px] md:h-[600px] animate-fade-in">
              {/* Customer Info Mini */}
              <div className="flex items-center justify-between mb-4 bg-rio-surface-muted px-3 py-2 rounded-lg border border-rio-border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-rio-muted">Cliente Seleccionado</p>
                  <p className="font-bold text-sm text-rio-ink truncate max-w-[200px]">{selectedCustomer?.name}</p>
                </div>
                <button onClick={() => { stopScanner(); setStep(1); }} className="text-[11px] font-bold text-rio-gold-dark hover:underline">
                  Cambiar
                </button>
              </div>

              {/* Manual Input */}
              <div className="mb-4">
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (manualSku.trim()) {
                      handleScan(manualSku.trim()); 
                      setManualSku(""); 
                    }
                  }} 
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Escribir SKU manual (Ej. ANI-001)"
                    value={manualSku}
                    onChange={(e) => setManualSku(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 border border-rio-border rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink bg-rio-surface-muted"
                  />
                  <button 
                    type="submit" 
                    className="bg-rio-ink hover:bg-rio-ink/90 transition-colors text-white px-6 py-3 rounded-xl font-bold text-sm"
                  >
                    Buscar
                  </button>
                </form>
              </div>

              {/* Scanner Area */}
              <div className="flex-1 rounded-2xl overflow-hidden border-2 border-rio-ink/10 relative bg-black flex flex-col items-center justify-center">
                <style jsx global>{`
                  #qr-reader { width: 100%; height: 100%; border: none !important; }
                  #qr-reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
                  #qr-reader__dashboard_section_csr { display: none !important; }
                `}</style>
                
                <div id={scannerRegionId} className="w-full h-full bg-black absolute inset-0 z-0"></div>
                
                {!isScanning ? (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10 p-6 text-center">
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

                {/* Scanned Item Modal overlay */}
                {scannedProduct && (
                  <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-[280px] shadow-2xl animate-scale-in">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-rio-ink">¡Referencia Escaneada!</h4>
                        <button onClick={cancelScan} className="text-rio-muted hover:text-rio-ink"><X className="w-5 h-5"/></button>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-rio-surface-muted p-2 rounded-xl mb-3 border border-rio-border">
                        <img src={scannedProduct.imageUrl || undefined} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-rio-muted font-mono">{scannedProduct.sku}</p>
                          <p className="text-[13px] font-bold leading-tight truncate">{scannedProduct.name}</p>
                          <p className="text-rio-gold-dark font-bold text-sm mt-0.5">{formatPrice(scannedProduct.price)}</p>
                        </div>
                      </div>

                      <div className="bg-rio-background p-2 rounded-lg mb-4 text-center border border-rio-border flex flex-col items-center justify-center">
                        <span className="text-[10px] text-rio-muted font-bold uppercase tracking-wider mb-0.5">Inventario Disponible</span>
                        <span className={`text-sm font-black ${(scannedProduct.physicalStock - scannedProduct.reservedStock) > 10 ? 'text-rio-success' : (scannedProduct.physicalStock - scannedProduct.reservedStock) > 0 ? 'text-rio-warning' : 'text-rio-danger'}`}>
                          {(scannedProduct.physicalStock - scannedProduct.reservedStock)} unidades
                        </span>
                      </div>

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

                      <button 
                        onClick={confirmScan} 
                        disabled={(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0}
                        className="w-full bg-black disabled:bg-rio-border disabled:text-rio-muted text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                      >
                        {(scannedProduct.physicalStock - scannedProduct.reservedStock) === 0 ? 'Sin Inventario' : 'Agregar a la Orden'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Cart) */}
        <div className="w-full md:w-[400px] shrink-0 md:pl-6 md:border-l md:border-rio-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rio-gold-dark"/>
              <h2 className="font-serif font-bold text-lg text-rio-ink">Pedido Actual</h2>
            </div>
            <span className="bg-rio-surface-muted px-2 py-1 rounded-full text-[11px] font-bold text-rio-ink">{totalItems} refs</span>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-[150px] md:min-h-[400px] border border-rio-border rounded-xl bg-rio-background/50 p-2 space-y-2 mb-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-rio-muted p-6 text-center">
                <ShoppingBag className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-medium">El pedido está vacío.<br/>Escanea prendas para comenzar.</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} className="flex gap-3 bg-white p-2 rounded-lg border border-rio-border shadow-sm">
                  <img src={item.product.imageUrl || undefined} alt="" className="w-12 h-12 rounded-md object-cover border border-rio-border" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[10px] text-rio-muted font-mono">{item.product.sku}</p>
                    <p className="text-xs font-bold text-rio-ink truncate">{item.product.name}</p>
                    <p className="text-xs font-bold text-rio-gold-dark">{formatPrice(item.product.price)} x {item.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border border-rio-border rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-rio-muted font-bold uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black text-rio-ink">{formatPrice(totalAmount)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || !selectedCustomer}
              className="w-full bg-rio-gold-dark disabled:bg-rio-border disabled:text-rio-muted text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-rio-gold active:scale-[0.98] transition-all flex items-center justify-center"
            >
              Finalizar Venta <Check className="w-5 h-5 ml-2"/>
            </button>
            {(!selectedCustomer && cartItems.length > 0) && (
              <p className="text-[10px] text-center text-rio-danger mt-2">Selecciona un cliente para finalizar.</p>
            )}
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-rio-border flex justify-between items-center bg-rio-surface-muted">
              <h3 className="font-bold text-rio-ink flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-rio-gold-dark" />
                Registrar Cliente Nuevo
              </h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="p-1 hover:bg-rio-border rounded-full text-rio-muted hover:text-rio-ink"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-rio-muted uppercase mb-1.5">Nombre Completo / Empresa *</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-rio-border bg-rio-background text-sm focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink"
                  placeholder="Ej. Comercializadora Oro S.A."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rio-muted uppercase mb-1.5">Correo Electrónico (Opcional)</label>
                <input 
                  type="email" 
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-rio-border bg-rio-background text-sm focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-rio-muted uppercase mb-1.5">Teléfono (Opcional)</label>
                  <input 
                    type="tel" 
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-rio-border bg-rio-background text-sm focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink"
                    placeholder="3001234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rio-muted uppercase mb-1.5">Dirección (Opcional)</label>
                  <input 
                    type="text" 
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-rio-border bg-rio-background text-sm focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink"
                    placeholder="Calle 10 # 45-23"
                  />
                </div>
              </div>
              <p className="text-[11px] text-rio-muted mt-4 bg-rio-gold-light/10 p-3 rounded-lg border border-rio-gold-light/30">
                Al crear un pedido con este cliente temporal, el administrador lo verá como nuevo y podrá formalizarlo en el sistema.
              </p>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewCustomerModal(false)} 
                  className="flex-1 py-3.5 border border-rio-border text-rio-ink rounded-xl text-sm font-semibold hover:bg-rio-surface-muted transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-rio-ink text-white rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors"
                >
                  Continuar a Escanear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
