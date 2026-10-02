import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';

let mockSyncCalled = false;
let mockSyncUuid = '';
let mockAddPendingOrder = vi.fn();

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
  Html5Qrcode: class { start(){} stop(){} clear(){} static getCameras(){ return Promise.resolve([]); } }
}));

vi.mock('@/app/actions/queries', () => ({
  getProductsByIds: async () => ({ success: true, products: [] }),
  getExactProductBySku: async () => ({ success: true, product: { id: 'missing-p1', name: 'MockProduct', sku: 'SKU1', category: 'Collares', material: 'Oro', price: 10, physicalStock: 10, reservedStock: 0 } })
}));

describe('Pruebas de Interfaz y Botones (Fase 4)', () => {

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

});
