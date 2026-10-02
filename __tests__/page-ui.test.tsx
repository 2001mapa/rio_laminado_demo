import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';

// 1. Mock dependencies
let mockSyncCalled = false;
let mockSyncUuid = '';

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({
    customers: [{ id: 'C1', name: 'Cliente UI', email: 'ui@test.com' }],
    products: [], // Empty products triggers the offline catalog warning
    checkoutSeller: async () => {},
    syncPendingOrders: async (uuid: string) => {
        mockSyncCalled = true;
        mockSyncUuid = uuid;
    }
  })
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'seller-1' } } }) }
  })
}));

vi.mock('@/lib/offlineQueue', () => ({
  getPendingOrders: async () => [
    {
      clientRequestId: 'fail-biz-1',
      sellerId: 'seller-1',
      customerName: 'Cliente Reintento UI',
      status: 'failed_fatal',
      lastError: 'Stock insuficiente (Simulado)',
      createdAt: Date.now(),
      retryCount: 0
    },
    {
      clientRequestId: 'fail-net-max',
      sellerId: 'seller-1',
      customerName: 'Cliente Resultado Incierto',
      status: 'failed_intervention',
      lastError: 'Requiere verificar con servidor',
      createdAt: Date.now(),
      retryCount: 5
    }
  ],
  removePendingOrder: async () => {},
  loadDraft: async () => ({ cart: [{ productId: 'missing-p1', quantity: 1 }], clientId: 'C1' })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} })
}));

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class { start(){} stop(){} clear(){} static getCameras(){ return Promise.resolve([]); } }
}));

describe('NuevaVentaPage UI', () => {
  it('Debe renderizar la cola de IndexedDB, el aviso de catálogo y ocultar Descartar en failed_intervention', async () => {
    render(<NuevaVentaPage />);

    // Wait for the queue block to appear
    await waitFor(() => {
      expect(screen.queryByText(/Cola de Envíos/)).not.toBeNull();
    });

    // 1. Verify Catalog Alert
    expect(screen.getByText('Requiere recargar catálogo')).not.toBeNull();

    // 2. Verify pending cards are rendered
    const cardFatal = screen.getByText('Cliente Reintento UI').closest('div');
    const cardIntervention = screen.getByText('Cliente Resultado Incierto').closest('div');
    
    expect(cardFatal).not.toBeNull();
    expect(cardIntervention).not.toBeNull();
    
    // 3. Verify Discard button visibility per state
    // failed_fatal -> SHOULD have Descartar
    const discardBtnsFatal = cardFatal!.querySelectorAll('button');
    const hasDiscardFatal = Array.from(discardBtnsFatal).some(b => b.textContent?.includes('Descartar'));
    expect(hasDiscardFatal).toBe(true);

    // failed_intervention -> SHOULD NOT have Descartar
    const discardBtnsIntervention = cardIntervention!.querySelectorAll('button');
    const hasDiscardIntervention = Array.from(discardBtnsIntervention).some(b => b.textContent?.includes('Descartar'));
    expect(hasDiscardIntervention).toBe(false);

    // Both should have Reintentar
    const hasRetryIntervention = Array.from(discardBtnsIntervention).some(b => b.textContent?.includes('Reintentar'));
    expect(hasRetryIntervention).toBe(true);
    
    // 4. Verify interaction
    const retryBtns = screen.getAllByText('Reintentar');
    fireEvent.click(retryBtns[0]); // clicks the first retry (fail-biz-1)

    await waitFor(() => {
      expect(mockSyncCalled).toBe(true);
      expect(mockSyncUuid).toBe('fail-biz-1');
    });
  });
});
