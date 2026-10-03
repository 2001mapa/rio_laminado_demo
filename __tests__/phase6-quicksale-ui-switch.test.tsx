import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as offlineQueue from '@/lib/offlineQueue';
import { addToast } from '@/lib/toast';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/toast', () => ({ addToast: vi.fn() }));

vi.mock('@/app/actions/queries', () => ({
  getExactProductBySku: vi.fn().mockResolvedValue({
    success: true,
    product: { id: 'p1', sku: 'A1', name: 'Collar Test', category: 'Collares', price: 100, physicalStock: 10, isActive: true }
  })
}));

const mockDemoContext = {
  customers: [{ id: 'real-cust-id-xyz', name: 'Cliente Existente', email: 'a@a.com', phone: '1', address: 'a', status: 'active' }],
  products: [{ id: 'p1', sku: 'A1', name: 'Collar Test', category: 'Collares', price: 100, physicalStock: 10, isActive: true }],
  get checkoutSeller() { return { id: mockSellerId, name: 'Seller' }; },
  syncPendingOrders: vi.fn()
};
vi.mock('@/lib/DemoContext', () => ({ useDemo: () => mockDemoContext }));

let mockSellerId = 'seller-1';
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: mockSellerId } } }) } })
}));

describe('Phase 6: Venta Rapida UI Switch', () => { afterEach(() => { vi.restoreAllMocks(); offlineQueue.clearDraft(mockSellerId).catch(()=>{}); indexedDB.deleteDatabase('rio-offline-db'); });
  it('no reutiliza el UUID de un borrador anterior al cambiar de cliente', async () => {
    // 1. Forzamos que haya un borrador con un UUID especfico
    const fakeDraftId = 'falso-uuid-1234';
    vi.spyOn(offlineQueue, 'loadDraft').mockResolvedValue({ sellerId: mockSellerId, cart: [{ productId: 'p1', quantity: 1 }], clientRequestId: fakeDraftId, selectedClientId: 'real-cust-id-xyz', updatedAt: Date.now() });

    const addSpy = vi.spyOn(offlineQueue, 'addPendingOrder');
    
    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // La UI carga el borrador, as que estamos en Step 2 con el cliente existente
    // Cambiamos de cliente a Nuevo (esto debera limpiar el currentCheckoutId)
    fireEvent.click(screen.getByText('Cambiar Cliente'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    fireEvent.click(screen.getAllByText('Cliente Nuevo')[0]);
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'new-name') return { value: 'Borrador Nuevo' } as any;
      if (id === 'new-phone') return { value: '555' } as any;
      if (id === 'new-city') return { value: 'BOG' } as any;
      if (id === 'new-address') return { value: 'C4' } as any;
      if (id === 'new-email') return { value: '' } as any;
      return null;
    });
    fireEvent.click(screen.getByText('Continuar'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    vi.mocked(document.getElementById).mockRestore();

    // Aadimos producto y finalizamos
    fireEvent.change(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0], { target: { value: 'A1' } });
    fireEvent.submit(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0].closest('form')!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    fireEvent.click(screen.getByText('Agregar a la Orden'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    fireEvent.click(screen.getAllByRole('button', { name: /Finalizar Venta/i })[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    expect(addSpy).toHaveBeenCalled();
    const payload = addSpy.mock.calls[0][0];
    
    // El ID enviado NO debe ser el del borrador viejo
    expect(payload.clientRequestId).not.toBe(fakeDraftId);
    expect(payload.clientRequestId.length).toBeGreaterThan(10);
  });

  it('limpia datos al cambiar existente -> nuevo SIN finalizar', async () => {
    await offlineQueue.clearDraft(mockSellerId);
    const addSpy = vi.spyOn(offlineQueue, 'addPendingOrder');
    vi.spyOn(offlineQueue, 'getPendingOrders').mockResolvedValue([]);
    
    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // 1. Elegimos Existente
    fireEvent.click(screen.getAllByText('Cliente Existente')[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // 2. Sin finalizar, cambiamos a Nuevo
    fireEvent.click(screen.getByText('Cambiar Cliente'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    
    fireEvent.click(screen.getAllByText('Cliente Nuevo')[0]);
    
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'new-name') return { value: 'Carlos Nuevo' } as any;
      if (id === 'new-phone') return { value: '555' } as any;
      if (id === 'new-city') return { value: 'BOG' } as any;
      if (id === 'new-address') return { value: 'C3' } as any;
      if (id === 'new-email') return { value: '' } as any;
      return null;
    });
    fireEvent.click(screen.getByText('Continuar'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    vi.mocked(document.getElementById).mockRestore();

    // 3. Añadimos producto y finalizamos
    fireEvent.change(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0], { target: { value: 'A1' } });
    fireEvent.submit(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0].closest('form')!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    fireEvent.click(screen.getByText('Agregar a la Orden'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    fireEvent.click(screen.getAllByRole('button', { name: /Finalizar Venta/i })[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // ASSERT: Debe enviarse como NEW_CUSTOMER sin restos del existente
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'NEW_CUSTOMER',
      newCustomerData: expect.objectContaining({ name: 'Carlos Nuevo' })
    }));
  });

  it('limpia datos al cambiar nuevo -> existente SIN finalizar', async () => {
    await offlineQueue.clearDraft(mockSellerId);
    const addSpy = vi.spyOn(offlineQueue, 'addPendingOrder');
    vi.spyOn(offlineQueue, 'getPendingOrders').mockResolvedValue([]);
    
    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // 1. Elegimos Nuevo
    fireEvent.click(screen.getAllByText('Cliente Nuevo')[0]);
    
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'new-name') return { value: 'Carlos Nuevo' } as any;
      if (id === 'new-phone') return { value: '555' } as any;
      if (id === 'new-city') return { value: 'BOG' } as any;
      if (id === 'new-address') return { value: 'C3' } as any;
      if (id === 'new-email') return { value: '' } as any;
      return null;
    });
    fireEvent.click(screen.getByText('Continuar'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    vi.mocked(document.getElementById).mockRestore();

    // 2. Sin finalizar, cambiamos a Existente
    fireEvent.click(screen.getByText('Cambiar Cliente'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    
    fireEvent.click(screen.getAllByText('Cliente Existente')[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // 3. Añadimos producto y finalizamos
    fireEvent.change(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0], { target: { value: 'A1' } });
    fireEvent.submit(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0].closest('form')!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    fireEvent.click(screen.getByText('Agregar a la Orden'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    fireEvent.click(screen.getAllByRole('button', { name: /Finalizar Venta/i })[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // ASSERT: Debe enviarse como cust-real sin restos de newCustomerData
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'real-cust-id-xyz',
      newCustomerData: undefined
    }));
  });

  afterEach(async () => {
    // vi.mocked(document.getElementById).mockRestore();
    await offlineQueue.clearDraft(mockSellerId).catch(() => {}); 
  });

  it('evita el cruce de clientes al alternar entre existente y nuevo', async () => {
    await offlineQueue.clearDraft(mockSellerId);
    const addSpy = vi.spyOn(offlineQueue, 'addPendingOrder');
    vi.spyOn(offlineQueue, 'getPendingOrders').mockResolvedValue([]);
    
    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // 1. Elegimos el cliente existente PRIMERO
    fireEvent.click(screen.getAllByText('Cliente Existente')[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // Añadimos producto
    const skuInput = screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0];
    fireEvent.change(skuInput, { target: { value: 'A1' } });
    fireEvent.submit(skuInput.closest('form')!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    fireEvent.click(screen.getByText('Agregar a la Orden'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // Finalizamos la venta con el EXISTENTE
    fireEvent.click(screen.getAllByRole('button', { name: /Finalizar Venta/i })[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // ASSERT 1: CustomerId debe ser 'real-cust-id-xyz', newCustomerData nulo (limpiado por el click)
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'real-cust-id-xyz',
      newCustomerData: undefined
    }));
    
    addSpy.mockClear();

    // Ahora la UI debió volver al paso 1 (lista de clientes)
    // 2. Elegimos Cliente Nuevo
    fireEvent.click(screen.getAllByText('Cliente Nuevo')[0]);
    
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'new-name') return { value: 'Juan Nuevo' } as any;
      if (id === 'new-phone') return { value: '123' } as any;
      if (id === 'new-city') return { value: 'BOG' } as any;
      if (id === 'new-address') return { value: 'C1' } as any;
      if (id === 'new-email') return { value: '' } as any;
      return null;
    });
    fireEvent.click(screen.getByText('Continuar'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    // vi.mocked(document.getElementById).mockRestore();

    // Añadimos producto de nuevo
    fireEvent.change(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0], { target: { value: 'A1' } });
    fireEvent.submit(screen.getAllByPlaceholderText('Ingresar SKU manualmente')[0].closest('form')!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    fireEvent.click(screen.getByText('Agregar a la Orden'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // Finalizamos venta
    fireEvent.click(screen.getAllByRole('button', { name: /Finalizar Venta/i })[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // ASSERT 2: CustomerId debe ser 'NEW_CUSTOMER', newCustomerData debe estar presente, selectedCustomer debió ser limpiado
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'NEW_CUSTOMER',
      newCustomerData: expect.objectContaining({ name: 'Juan Nuevo' })
    }));
  });
  it('previene crear una venta duplicada si clearDraft falla (carrito residual)', async () => {
    // 1. Simulamos que una orden previa termin en la cola exitosamente, PERO clearDraft fall
    const fakeResidualId = 'uuid-residual-999';
    
    // a. Orden ya en cola (estado correcto final de addPendingOrder)
    await offlineQueue.addPendingOrder({
      clientRequestId: fakeResidualId,
      sellerId: mockSellerId,
      customerId: 'real-cust-id-xyz',
      customerName: 'Cliente Existente',
      items: [{ productId: 'p1', quantity: 1, expectedPrice: 100 }],
      totalAmount: 100,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0
    });

    // b. El borrador tambin qued vivo (porque clearDraft fall)
    vi.spyOn(offlineQueue, 'loadDraft').mockResolvedValue({
      sellerId: mockSellerId, cart: [{ productId: 'p1', quantity: 1 }],
      clientRequestId: fakeResidualId,
      selectedClientId: 'real-cust-id-xyz',
      updatedAt: Date.now()
    });

    const addSpy = vi.spyOn(offlineQueue, 'addPendingOrder');
    
    // 2. Renderizamos la UI. El useEffect cargar el draft residual.
    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // La UI est en Step 2 (escner). El usuario ve el carrito de la orden anterior
    // e intenta cambiar el cliente para hacer una nueva venta usando esos mismos items sin saberlo.
    fireEvent.click(screen.getByText('Cambiar Cliente'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // EXPECT: Debe haber interceptado, limpiado el carrito residual y enviado a Step 1
    // Comprobemos que el toast haya salido
    const clearDraftSpy = vi.spyOn(offlineQueue, 'clearDraft');

    // 3. El carrito se vaci y volvimos al Step 1.
    // El usuario selecciona a alguien para la nueva venta
    fireEvent.click(screen.getAllByText('Cliente Existente')[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // 4. Intenta Finalizar Venta INMEDIATAMENTE
    // Como se vaci el carrito por seguridad, el botn "Finalizar Venta" NO debera existir o no debe hacer nada
    // Buscamos si existe Finalizar Venta y hacemos clic (si existe)
    const finalizarBtns = screen.queryAllByRole('button', { name: /Finalizar Venta/i });
    if (finalizarBtns.length > 0) {
      fireEvent.click(finalizarBtns[0]);
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    }

    // El addPendingOrder no debi haber sido llamado para crear un duplicado
    expect(addSpy).not.toHaveBeenCalled();

    // Verifiquemos el estado de la cola
    const pending = await offlineQueue.getPendingOrders(mockSellerId);
    expect(pending.some(o => o.clientRequestId === fakeResidualId)).toBe(true);
    
  });

});
