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
  customers: [{ id: 'cust-real', name: 'Cliente Existente', email: 'a@a.com', phone: '1', address: 'a', status: 'active' }],
  products: [{ id: 'p1', sku: 'A1', name: 'Collar Test', category: 'Collares', price: 100, physicalStock: 10, isActive: true }],
  get checkoutSeller() { return { id: 'seller-1', name: 'Seller' }; },
  syncPendingOrders: vi.fn()
};
vi.mock('@/lib/DemoContext', () => ({ useDemo: () => mockDemoContext }));

let mockSellerId = 'seller-1';
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: mockSellerId } } }) } })
}));

describe('Phase 6: Venta Rapida UI Switch', () => {
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
    fireEvent.change(screen.getByPlaceholderText('Ingresar SKU manualmente'), { target: { value: 'A1' } });
    fireEvent.submit(screen.getByPlaceholderText('Ingresar SKU manualmente').closest('form')!);
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
    fireEvent.change(screen.getByPlaceholderText('Ingresar SKU manualmente'), { target: { value: 'A1' } });
    fireEvent.submit(screen.getByPlaceholderText('Ingresar SKU manualmente').closest('form')!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    fireEvent.click(screen.getByText('Agregar a la Orden'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    fireEvent.click(screen.getAllByRole('button', { name: /Finalizar Venta/i })[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // ASSERT: Debe enviarse como cust-real sin restos de newCustomerData
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'cust-real',
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
    const skuInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
    fireEvent.change(skuInput, { target: { value: 'A1' } });
    fireEvent.submit(skuInput.closest('form')!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    fireEvent.click(screen.getByText('Agregar a la Orden'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // Finalizamos la venta con el EXISTENTE
    fireEvent.click(screen.getAllByRole('button', { name: /Finalizar Venta/i })[0]);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // ASSERT 1: CustomerId debe ser 'cust-real', newCustomerData nulo (limpiado por el click)
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'cust-real',
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
    fireEvent.change(screen.getByPlaceholderText('Ingresar SKU manualmente'), { target: { value: 'A1' } });
    fireEvent.submit(screen.getByPlaceholderText('Ingresar SKU manualmente').closest('form')!);
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
});
