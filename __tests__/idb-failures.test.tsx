import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as idb from 'idb';

let addToastMock = vi.fn();

vi.mock('@/lib/toast', () => ({
  addToast: (msg: string) => addToastMock(msg)
}));

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({
    customers: [{ id: 'C1', name: 'Cliente UI', email: 'ui@test.com' }],
    products: [], 
    checkoutSeller: async () => {},
    syncPendingOrders: async (uuid: string) => {},
    currentSeller: { id: 'seller-1' }
  })
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'seller-1' } } }) }
  })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })
}));

vi.mock('@/app/actions/queries', () => ({
  getExactProductBySku: vi.fn(async () => ({
      success: true,
      product: { id: 'P1', sku: 'SKU1', name: 'MockProduct', price: 100, physicalStock: 10, reservedStock: 0, category: 'Collares' }
  }))
}));

let mockDbPut = vi.fn();
let mockDbDelete = vi.fn();
let mockDbGet = vi.fn();
let mockDbGetAllFromIndex = vi.fn();

vi.mock('idb', async (importOriginal) => {
    return {
        openDB: vi.fn(async () => ({
            put: (...args: any) => mockDbPut(...args),
            delete: (...args: any) => mockDbDelete(...args),
            get: (...args: any) => mockDbGet(...args),
            getAllFromIndex: (...args: any) => mockDbGetAllFromIndex(...args),
            transaction: vi.fn(() => ({
                objectStore: vi.fn(() => ({
                    get: (...args: any) => mockDbGet(...args),
                    put: (...args: any) => mockDbPut(...args)
                })),
                done: Promise.resolve()
            }))
        }))
    }
});

let addedOrders: any[] = [];

describe('Fallas Reales en IDB (Fase 4)', () => {
  let originalError: any;
  beforeEach(() => {
    addedOrders = [];
    mockDbPut.mockReset().mockResolvedValue(undefined);
    mockDbDelete.mockReset().mockResolvedValue(undefined);
    mockDbGet.mockReset().mockResolvedValue(undefined);
    mockDbGetAllFromIndex.mockReset().mockResolvedValue([]);
    addToastMock.mockClear();
    
    // Suprimir warnings en consola pero NO silenciar fallos reales del test
    originalError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    console.error = originalError;
  });

  it('1. Error en saveDraft muestra advertencia y no promete protección', async () => {
      // Usamos reject normal y atrapamos la queja de unhandled rejections dentro del test o ignoramos
      mockDbPut.mockImplementation(async () => { throw new Error('QuotaExceededError') });

      render(<NuevaVentaPage />);
      
      await waitFor(() => {
         expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0); 
      });
      
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Error local: tu borrador no pudo ser protegido en el almacenamiento.');
      });
  });

  it('2. addPendingOrder exitoso pero clearDraft fallido bloquea segundo envío y retiene UUID', async () => {
      mockDbPut.mockImplementation(async (store, val) => {
         if (store === 'pending_orders') addedOrders.push(val);
      });
      mockDbGetAllFromIndex.mockImplementation(async () => addedOrders);
      
      // SOLO falla delete!
      mockDbDelete.mockImplementation(async () => { throw new Error('IDB Delete Error') });

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
         // El toast de error de try/catch
         // O el fallback de no borrador si el delete falla (está silenciado arriba, no importa)
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });

      // Volvemos a hacer clic (el UUID se conservó en memoria, pendingQueue NO TIENE, pero IDB sí)
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Este pedido ya está en la cola de envíos.');
      });
  });
});
