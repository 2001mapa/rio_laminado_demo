import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as offlineQueue from '@/lib/offlineQueue';

// Mock everything needed for page
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));
vi.mock('@/lib/toast', () => ({ addToast: vi.fn() }));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'seller-x' } } }) }
  })
}));

vi.mock('@/app/actions/queries', () => ({
  getPagedCatalog: vi.fn().mockRejectedValue(new Error('Network error')),
  getExactProductBySku: vi.fn().mockRejectedValue(new Error('Network error'))
}));

const mockDemoContext = {
  customers: [{ id: 'c1', name: 'Cliente X', status: 'active' }],
  products: [],
  checkoutSeller: { id: 'seller-x', name: 'Seller X', email: 'x@x.com', role: 'vendor' },
  syncPendingOrders: vi.fn()
};

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => mockDemoContext,
  DemoProvider: ({children}: any) => <div>{children}</div>
}));

describe('Phase 5: SKU Search Offline Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('escribir SKU sin red muestra sugerencias desde el catálogo local', async () => {
    // Mock navigator.onLine to false
    vi.stubGlobal('navigator', { onLine: false });

    // Mock searchOfflineProducts
    const offlineSpy = vi.spyOn(offlineQueue, 'searchOfflineProducts').mockResolvedValue([
      { id: '1', sku: 'ANILLO-99', name: 'Anillo Offline', price: 50, category: 'Anillos', physicalStock: 10, reservedStock: 0, isActive: true } as any
    ]);

    render(<NuevaVentaPage />);
    
    // Wait for Supabase to resolve and update state
    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    await act(async () => {
      // Step 1: select customer 
      try {
         const btn = screen.getByText('Cliente X');
         fireEvent.click(btn);
      } catch(e) {}
    });

    await act(async () => {
      const input = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(input, { target: { value: 'ANILLO' } });
      await new Promise(r => setTimeout(r, 400));
    });

    expect(offlineSpy).toHaveBeenCalledWith('ANILLO', 'seller-x');
    
    // Check if suggestion is rendered
    expect(screen.getByText('ANILLO-99')).toBeTruthy();
    expect(screen.getByText('Anillo Offline')).toBeTruthy();
    
    vi.unstubAllGlobals();
  });
});
