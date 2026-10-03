import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as offlineQueue from '@/lib/offlineQueue';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/toast', () => ({ addToast: vi.fn() }));

vi.mock('@/app/actions/queries', () => ({
  getExactProductBySku: vi.fn().mockResolvedValue({
    success: true,
    product: { id: 'p1', sku: 'A1', name: 'Anillo Test', category: 'Collares', price: 100, physicalStock: 10, isActive: true }
  }),
  getProductsByIds: vi.fn().mockResolvedValue({
    success: true,
    products: [{ id: 'p1', sku: 'A1', name: 'Anillo Test', category: 'Collares', price: 100, physicalStock: 10, isActive: true }]
  })
}));

const mockDemoContext = {
  customers: [],
  products: [{ id: 'p1', sku: 'A1', name: 'Anillo Test', category: 'Collares', price: 100, physicalStock: 10, isActive: true }],
  get checkoutSeller() { return { id: 'seller-1', name: 'Seller' }; },
  syncPendingOrders: vi.fn()
};
vi.mock('@/lib/DemoContext', () => ({ useDemo: () => mockDemoContext }));

let mockSellerId = 'seller-1';
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: mockSellerId } } }) } })
}));

describe('Phase 6: Venta Rapida UI', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await offlineQueue.clearDraft(mockSellerId).catch(() => {});
  });

  it('permite llenar datos de cliente nuevo, escanear y finalizar venta', async () => {
    mockSellerId = 'seller-test-1';
    await offlineQueue.clearDraft(mockSellerId);

    const addPendingOrderSpy = vi.spyOn(offlineQueue, 'addPendingOrder');
    
    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const btn = screen.getByText('Cliente Nuevo');
    fireEvent.click(btn);

    const nameInput = document.getElementById('new-name') as HTMLInputElement;
    const phoneInput = document.getElementById('new-phone') as HTMLInputElement;
    const cityInput = document.getElementById('new-city') as HTMLInputElement;
    const addressInput = document.getElementById('new-address') as HTMLInputElement;
    const emailInput = document.getElementById('new-email') as HTMLInputElement;
    
    nameInput.value = 'Juan Perez';
    phoneInput.value = '123';
    cityInput.value = 'Bogota';
    addressInput.value = 'Calle 1';
    emailInput.value = 'juan@test.com';
    
    fireEvent.change(nameInput, { target: { value: 'Juan Perez' } });
    fireEvent.click(screen.getByText('Continuar'));
    
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    expect(screen.getByText('Juan Perez')).toBeTruthy();

    // Simular escaneo de producto: El componente form onSubmit llama preventDefault y setManualSku("").
    // La busqueda se dispara por form submit.
    const skuInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
    fireEvent.change(skuInput, { target: { value: 'A1' } });
    
    const searchForm = skuInput.closest('form');
    fireEvent.submit(searchForm!);

    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // Cuando encuentra el producto muestra un modal para confirmar
    const confirmBtn = screen.getByText('Agregar a la Orden');
    fireEvent.click(confirmBtn);
    
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // Ahora la venta se puede finalizar
    const finalizarBtn = screen.getAllByRole('button', { name: /Finalizar Venta/i })[0] as HTMLButtonElement;
    expect(finalizarBtn.disabled).toBe(false);
    
    fireEvent.click(finalizarBtn);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    expect(addPendingOrderSpy).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'NEW_CUSTOMER',
      newCustomerData: expect.objectContaining({ name: 'Juan Perez', email: 'juan@test.com' })
    }));
  });

  it('restaura el borrador al recargar con cliente nuevo completo', async () => {
    mockSellerId = 'seller-test-2';
    await offlineQueue.saveDraft({
      sellerId: mockSellerId,
      cart: [{ productId: 'p1', quantity: 1, sizes: [] }],
      updatedAt: Date.now(),
      newCustomerData: { name: 'Maria', phone: '321', city: 'Cali', address: 'Calle 2', email: '' }
    });

    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    await waitFor(() => {
      expect(screen.getByText('Maria')).toBeTruthy();
    });
    
    const finalizarBtn = screen.getAllByRole('button', { name: /Finalizar Venta/i })[0] as HTMLButtonElement;
    expect(finalizarBtn.disabled).toBe(false);
  });
});
