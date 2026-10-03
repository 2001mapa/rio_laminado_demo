import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as offlineQueue from '@/lib/offlineQueue';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/toast', () => ({ addToast: vi.fn() }));

const mockDemoContext = {
  customers: [],
  products: [],
  get checkoutSeller() { return { id: 'seller-1', name: 'Seller' }; },
  syncPendingOrders: vi.fn()
};
vi.mock('@/lib/DemoContext', () => ({ useDemo: () => mockDemoContext }));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'seller-1' } } }) } })
}));

describe('Phase 6: Venta Rapida UI', () => {
  beforeEach(async () => { await offlineQueue.clearDraft('seller-1').catch(() => {});
    vi.clearAllMocks();
    await offlineQueue.clearDraft('seller-1').catch(() => {});
  });

  it('permite llenar datos de cliente nuevo y guardar en IDB', async () => {
    const saveDraftSpy = vi.spyOn(offlineQueue, 'saveDraft');
    
    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const btn = screen.getByText('Cliente Nuevo');
    fireEvent.click(btn);

    const nameInput = document.getElementById('new-name') as HTMLInputElement;
    const phoneInput = document.getElementById('new-phone') as HTMLInputElement;
    const cityInput = document.getElementById('new-city') as HTMLInputElement;
    const addressInput = document.getElementById('new-address') as HTMLInputElement;
    
    fireEvent.change(nameInput, { target: { value: 'Juan Perez' } });
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.change(cityInput, { target: { value: 'Bogota' } });
    fireEvent.change(addressInput, { target: { value: 'Calle 1' } });
    
    nameInput.value = 'Juan Perez';
    phoneInput.value = '123';
    cityInput.value = 'Bogota';
    addressInput.value = 'Calle 1';
    
    fireEvent.click(screen.getByText('Continuar'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    
    expect(screen.getByText('Juan Perez')).toBeTruthy();

    expect(saveDraftSpy).toHaveBeenCalledWith(expect.objectContaining({
      newCustomerData: expect.objectContaining({ name: 'Juan Perez', city: 'Bogota' })
    }));
  });

  it('restaura el borrador al recargar (draft/queue/recarga)', async () => {
    await offlineQueue.saveDraft({
      sellerId: 'seller-1',
      cart: [], updatedAt: Date.now(),
      newCustomerData: { name: 'Maria', phone: '321', city: 'Cali', address: 'Calle 2', email: '' }
    });

    render(<NuevaVentaPage />);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    await waitFor(() => {
      expect(screen.getByText('Maria')).toBeTruthy();
    });
  });
});
