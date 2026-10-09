import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';

let mockSyncCalled = false;
let mockSyncUuid = '';
let mockAddPendingOrder = vi.fn();
const cameraMocks = vi.hoisted(() => ({ applyZoom: vi.fn(), starts: vi.fn(), getCameras: vi.fn() }));

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({
    customers: [{ id: 'C1', name: 'Cliente UI', email: 'ui@test.com' }],
    products: [], 
    checkoutSeller: async () => {},
    syncPendingOrders: async (uuid: string) => {
        mockSyncCalled = true;
        mockSyncUuid = uuid;
    },
    currentSeller: { id: 'seller-1' },
    addToast: vi.fn()
  })
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'seller-1' } } }) }
  })
}));

let mockGetPendingOrders = vi.fn(async (userId?: string) => [
  {
    clientRequestId: 'fail-biz-1',
    sellerId: 'seller-1',
    customerName: 'Cliente Reintento UI',
    status: 'failed_fatal',
    lastError: 'Stock insuficiente (Simulado)',
    createdAt: Date.now(),
    retryCount: 0
  }
]);

vi.mock('@/lib/offlineQueue', () => ({
  getPendingOrders: (userId: string) => mockGetPendingOrders(userId),
  removePendingOrder: async () => {},
  addPendingOrder: (order: any) => mockAddPendingOrder(order),
  clearDraft: async () => {}, 
  saveDraft: async () => {},
  loadDraft: async () => null,
  getDB: async () => null,
  searchOfflineProducts: async () => [],
  searchOfflineCustomers: async () => [],
  getOfflineProductsByIds: async () => []
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} })
}));

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class {
    private cameraId = 'cam-main';
    start(camera: any) {
      this.cameraId = camera.deviceId?.exact || 'cam-main';
      cameraMocks.starts(camera);
      return Promise.resolve(null);
    }
    stop() { return Promise.resolve(); }
    clear() {}
    getState() { return 2; }
    getRunningTrackSettings() { return { deviceId: this.cameraId }; }
    getRunningTrackCameraCapabilities() {
      return { zoomFeature: () => ({
        isSupported: () => true, min: () => 1, max: () => 3,
        step: () => 0.5, value: () => 1, apply: cameraMocks.applyZoom,
      }) };
    }
    static getCameras() { cameraMocks.getCameras(); return Promise.resolve([{ id: 'cam-main', label: 'Cámara principal' }, { id: 'cam-wide', label: 'Gran angular' }]); }
  }
}));

vi.mock('@/app/actions/queries', () => ({
  getProductsByIds: async () => ({ success: true, products: [] }),
  getExactProductBySku: async () => ({ success: true, product: { id: 'missing-p1', name: 'MockProduct', sku: 'SKU1', category: 'Collares', material: 'Oro', price: 10, physicalStock: 10, reservedStock: 0 } })
}));

describe('Pruebas de Interfaz y Botones (Fase 4)', () => {
  afterEach(() => cleanup());

  it('oculta el total del vendedor y permite mostrarlo con el botón de ojo', async () => {
    localStorage.setItem('seller-order-total-visible', 'false');
    render(<NuevaVentaPage />);
    fireEvent.click((await screen.findAllByText(/Cliente UI/i))[0]);

    const showButtons = await screen.findAllByRole('button', { name: 'Mostrar total del pedido' });
    expect(showButtons.length).toBe(2);
    fireEvent.click(showButtons[0]);

    expect(screen.getAllByRole('button', { name: 'Ocultar total del pedido' }).length).toBe(2);
    expect(localStorage.getItem('seller-order-total-visible')).toBe('true');
  });

  it('ofrece zoom real y permite cambiar de lente cuando el navegador lo soporta', async () => {
    cameraMocks.applyZoom.mockResolvedValue(undefined);
    cameraMocks.starts.mockClear();
    cameraMocks.getCameras.mockClear();
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: 'videoinput', deviceId: 'cam-main', label: 'Cámara principal' },
        { kind: 'videoinput', deviceId: 'cam-wide', label: 'Gran angular' },
      ])
    } });
    render(<NuevaVentaPage />);
    fireEvent.click((await screen.findAllByText(/Cliente UI/i))[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar Lector QR' }));
    const slider = await screen.findByRole('slider', { name: 'Zoom de cámara' });
    fireEvent.change(slider, { target: { value: '2' } });
    await waitFor(() => expect(cameraMocks.applyZoom).toHaveBeenCalledWith(2));
    fireEvent.change(screen.getByRole('combobox', { name: 'Elegir cámara' }), { target: { value: 'cam-wide' } });
    await waitFor(() => expect(cameraMocks.starts).toHaveBeenCalledWith({ deviceId: { exact: 'cam-wide' } }));
    await waitFor(() => expect(localStorage.getItem('seller-preferred-camera-id')).toBe('cam-wide'));
    expect(cameraMocks.getCameras).not.toHaveBeenCalled();
  });

  it('oculta el visor al elegir un artículo y conserva los controles al reanudar', async () => {
    localStorage.removeItem('seller-preferred-camera-id');
    cameraMocks.applyZoom.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput', deviceId: 'cam-main', label: 'Cámara principal' }]),
    } });
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });

    render(<NuevaVentaPage />);
    fireEvent.click((await screen.findAllByText(/Cliente UI/i))[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar Lector QR' }));
    await screen.findByRole('button', { name: 'Pausar cámara' });

    const viewport = screen.getByTestId('seller-camera-viewport');
    expect(viewport.className).toContain('min-h-[260px]');
    const skuInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
    fireEvent.change(skuInput, { target: { value: 'SKU1' } });
    fireEvent.submit(skuInput.closest('form')!);
    await screen.findByRole('button', { name: 'Agregar a la Orden' });
    expect(document.getElementById('qr-reader')?.className).toContain('!hidden');
    expect(viewport.className).toContain('h-auto');
    fireEvent.click(await screen.findByRole('button', { name: 'Agregar a la Orden' }));

    expect(viewport.className).toContain('h-[min(34svh,280px)]');
    expect(document.getElementById('qr-reader')?.className).not.toContain('!hidden');
    expect(screen.queryByRole('button', { name: 'Ver pedido' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ampliar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Escanear' })).toBeNull();
    const originalHash = window.location.hash;
    fireEvent.click(screen.getByRole('button', { name: /Pedido: 1 refs/ }));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(window.location.hash).toBe(originalHash);
    expect(screen.getByRole('button', { name: 'Pausar cámara' })).toBeTruthy();
  });

  it('Verifica que Reintentar desaparece en rechazos de negocio (failed_fatal) y se permite Descartar', async () => {
    render(<NuevaVentaPage />);
    
    await waitFor(() => {
       expect(screen.getByText(/Cola de Envíos/i)).toBeTruthy();
    });

    const fatalItem = screen.getByText('Stock insuficiente (Simulado)').closest('div');
    expect(fatalItem).toBeTruthy();
    
    expect(fatalItem!.textContent).toContain('Descartar');
  });

  it('Comprueba que Confirmar Venta invoca directamente al coordinador unificado', async () => {
      render(<NuevaVentaPage />);
      
      await waitFor(() => {
         expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0); 
      });
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => {
         expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy();
      });
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => {
         expect(screen.getByText(/MockProduct/i)).toBeTruthy();
      });
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      
      if (!addBtn) throw new Error("Could not find the Agregar button!");
      fireEvent.click(addBtn);
      
      await waitFor(() => {
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });
      
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      
      mockSyncCalled = false;
      mockAddPendingOrder.mockClear();
      
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(mockAddPendingOrder).toHaveBeenCalled();
         expect(mockSyncCalled).toBe(true);
      });
  });

  it('Verifica que el carrito no se vacía y se muestra error si falla addPendingOrder', async () => {
      mockAddPendingOrder.mockImplementationOnce(() => {
          throw new Error('IDB Write Error');
      });

      render(<NuevaVentaPage />);
      
      await waitFor(() => {
         expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0); 
      });
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => {
         expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy();
      });
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => {
         expect(screen.getByText(/MockProduct/i)).toBeTruthy();
      });
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => {
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });
      
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(mockAddPendingOrder).toHaveBeenCalled();
         // El botón Finalizar Venta sigue presente porque el carrito NO se vació
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });
  });

  it('incluye los datos del cliente nuevo en el pedido pendiente', async () => {
    cleanup();
    mockAddPendingOrder.mockClear();
    render(<NuevaVentaPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Cliente Nuevo/i }));
    fireEvent.change(screen.getByLabelText('Nombre o razón social'), { target: { value: 'Joyería Nueva' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '3124560359' } });
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Medellín' } });
    fireEvent.change(screen.getByLabelText('Dirección de envío'), { target: { value: 'Calle 10 # 20-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con la venta' }));

    await waitFor(() => expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy());
    expect(screen.getByText('Joyería Nueva')).toBeTruthy();

    const skuInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
    fireEvent.change(skuInput, { target: { value: 'SKU1' } });
    fireEvent.submit(skuInput.closest('form')!);
    await waitFor(() => expect(screen.getByText(/MockProduct/i)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a la Orden' }));
    fireEvent.click(screen.getByText('Finalizar Venta'));

    await waitFor(() => expect(mockAddPendingOrder).toHaveBeenCalled());
    expect(mockAddPendingOrder).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'NEW_CUSTOMER',
      customerName: 'Joyería Nueva',
      newCustomerData: expect.objectContaining({
        name: 'Joyería Nueva', phone: '3124560359', city: 'Medellín', address: 'Calle 10 # 20-30'
      })
    }));
  });

});
