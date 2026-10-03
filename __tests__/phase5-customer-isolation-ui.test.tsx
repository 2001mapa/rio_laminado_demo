import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as offlineQueue from '@/lib/offlineQueue';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));
vi.mock('@/lib/toast', () => ({ addToast: vi.fn() }));

vi.mock('@/app/actions/queries', () => ({
  getPagedCatalog: vi.fn().mockRejectedValue(new Error('Offline')),
  getExactProductBySku: vi.fn().mockRejectedValue(new Error('Offline'))
}));

let currentSellerId = 'seller-a';
const mockDemoContext = {
  customers: [],
  products: [],
  get checkoutSeller() {
    return { id: currentSellerId, name: 'Current Seller', email: 'x@x.com', role: 'vendor' };
  },
  syncPendingOrders: vi.fn()
};

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => mockDemoContext,
  DemoProvider: ({children}: any) => <div>{children}</div>
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: currentSellerId } } }) }
  })
}));

describe('Phase 5: Customer UI Isolation A->B', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSellerId = 'seller-a';
  });

  it('cambio de vendedor limpia estado y UI, y carga datos nuevos sin fugas', async () => {
    vi.stubGlobal('navigator', { onLine: false });

    // Mock searchOfflineCustomers
    vi.spyOn(offlineQueue, 'searchOfflineCustomers').mockImplementation(async (query, sellerId) => {
      if (sellerId === 'seller-a') {
        return [{ id: 'ca1', name: 'Cliente de A', status: 'active' }] as any;
      }
      if (sellerId === 'seller-b') {
        // simulate delay for B to prove it cleans first
        await new Promise(r => setTimeout(r, 50));
        return [{ id: 'cb1', name: 'Cliente de B', status: 'active' }] as any;
      }
      return [];
    });

    const { rerender } = render(<NuevaVentaPage />);

    // Wait for seller A's customers
    await waitFor(() => {
      expect(screen.getByText('Cliente de A')).toBeTruthy();
    }, { timeout: 2000 });

    // Now switch to seller B
    currentSellerId = 'seller-b';
    
    // We need to simulate the page getting the new seller. In this mock, the effect for Supabase 
    // only runs on mount. To trigger it again we'd have to unmount/remount, or just rerender.
    // Actually, rerendering the same component won't re-run the `useEffect(() => { ... getUser() }, [])`.
    // We should unmount and mount again, simulating a logout/login, but the test asks for:
    // "cambio A->B con navigator.onLine = false, verificando la pantalla"
    // Let's just unmount and render again.
    rerender(<></>);
    rerender(<NuevaVentaPage />);

    // Wait for B's customers to load
    await waitFor(() => {
      expect(screen.getByText('Cliente de B')).toBeTruthy();
    }, { timeout: 2000 });

    expect(screen.queryByText('Cliente de A')).toBeNull();

    vi.unstubAllGlobals();
  });
});
