import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as idb from 'idb';

let addToastMock = vi.fn();
vi.mock('@/lib/toast', () => ({ addToast: (msg: string) => addToastMock(msg) }));

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
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'seller-1' } } }) } })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })
}));

vi.mock('@/app/actions/queries', () => ({
  getExactProductBySku: vi.fn(async () => ({
      success: true,
      product: { id: 'P1', sku: 'SKU1', name: 'MockProduct', price: 100, physicalStock: 10, reservedStock: 0, category: 'Collares' }
  })),
  getProductsByIds: vi.fn(async () => ({
      success: true,
      products: [{ id: 'P1', sku: 'SKU1', name: 'MockProduct', price: 100, physicalStock: 10, reservedStock: 0, category: 'Collares' }]
  })),
  getPagedCatalog: vi.fn(async () => ({ success: true, products: [] }))
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
                    put: (...args: any) => mockDbPut(...args),
                    delete: (...args: any) => mockDbDelete(...args)
                })),
                done: Promise.resolve()
            }))
        }))
    }
});

let dbStore: Record<string, Record<string, any>> = { drafts: {}, pending_orders: {} };

describe('Fallas Reales en IDB y Recargas (Fase 4)', () => {
  let originalError: any;
  beforeEach(() => {
    dbStore = { drafts: {}, pending_orders: {} };
    
    mockDbPut.mockReset().mockImplementation(async (store, val, key) => {
      if (store === 'drafts') dbStore.drafts[key || val.sellerId] = val;
      if (store === 'pending_orders') dbStore.pending_orders[val.clientRequestId] = val;
    });
    mockDbDelete.mockReset().mockImplementation(async (store, key) => {
      if (store === 'drafts') delete dbStore.drafts[key];
    });
    mockDbGet.mockReset().mockImplementation(async (store, key) => {
      if (store === 'drafts') return dbStore.drafts[key];
      return undefined;
    });
    mockDbGetAllFromIndex.mockReset().mockImplementation(async (store, indexName, key) => {
      if (store === 'pending_orders') return Object.values(dbStore.pending_orders).filter(o => o.sellerId === key);
      return [];
    });
    addToastMock.mockClear();
    
    originalError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    console.error = originalError;
  });

  it('1. Error en saveDraft muestra advertencia y no promete protección', async () => {
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
      // SOLO falla delete!
      mockDbDelete.mockImplementation(async () => { throw new Error('IDB Delete Error') });

      render(<NuevaVentaPage />);
      
      await waitFor(() => expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0));
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy());
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => expect(screen.getByText(/MockProduct/i)).toBeTruthy());
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy());
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(Object.keys(dbStore.pending_orders).length).toBe(1);
      });

      const newConfirmBtn = screen.getByText(/Finalizar Venta/i);
      fireEvent.click(newConfirmBtn);

      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Este pedido ya está en la cola de envíos.');
      });
  });

  it('3. Recarga de página tras clearDraft fallido retiene UUID, consulta IDB y bloquea duplicado', async () => {
      mockDbDelete.mockImplementation(async () => { throw new Error('IDB Delete Error') });

      const { unmount } = render(<NuevaVentaPage />);
      
      await waitFor(() => expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0));
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy());
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => expect(screen.getByText(/MockProduct/i)).toBeTruthy());
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy());
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(Object.keys(dbStore.pending_orders).length).toBe(1);
         expect(dbStore.drafts['seller-1']).toBeDefined();
         expect(dbStore.drafts['seller-1'].clientRequestId).toBeDefined();
      });

      const generatedUUID = dbStore.drafts['seller-1'].clientRequestId;

      // Desmontamos (simulando recarga de página/cierre)
      unmount();
      cleanup();

      // Montamos nuevamente
      render(<NuevaVentaPage />);

      await waitFor(() => {
         expect(screen.getByText(/MockProduct/i)).toBeTruthy();
      });

      const newConfirmBtn = screen.getByText(/Finalizar Venta/i);
      
      // SEGUNDO CLIC (Tras recarga)
      fireEvent.click(newConfirmBtn);

      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Este pedido ya está en la cola de envíos.');
      });

      expect(Object.keys(dbStore.pending_orders).length).toBe(1);
      expect(Object.keys(dbStore.pending_orders)[0]).toBe(generatedUUID);
  });

  it('4. Fallo al guardar el UUID en checkout detiene el envio y no promete borrador protegido', async () => {
      render(<NuevaVentaPage />);
      
      await waitFor(() => expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0));
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy());
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => expect(screen.getByText(/MockProduct/i)).toBeTruthy());
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy());
      
      // Hacemos que el put de drafts devuelva error JUSTO ANTES de finalizar la venta
      mockDbPut.mockImplementation(async (store, val, key) => {
         if (store === 'drafts') throw new Error('QuotaExceededError Checkout');
      });

      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Error al bloquear el borrador. Revisa tu almacenamiento local.');
      });
      
      // Verificamos que pending_orders quedó vacio (se abortó)
      expect(Object.keys(dbStore.pending_orders).length).toBe(0);
      
      // Verificamos que no se mostró el toast de éxito
      expect(addToastMock).not.toHaveBeenCalledWith('Borrador guardado localmente.');
  });

  it('5. Dos clics: fallo en el primer saveDraft de UUID detiene proceso, el segundo guarda correctamente', async () => {
      let failedOnce = false;
      mockDbPut.mockImplementation(async (store, val, key) => {
         if (store === 'drafts' && val.clientRequestId && !failedOnce) {
             failedOnce = true;
             throw new Error('QuotaExceededError Checkout');
         }
         if (store === 'drafts') dbStore.drafts[key || val.sellerId] = val;
         if (store === 'pending_orders') dbStore.pending_orders[val.clientRequestId] = val;
      });

      render(<NuevaVentaPage />);
      
      await waitFor(() => expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0));
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy());
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => expect(screen.getByText(/MockProduct/i)).toBeTruthy());
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy());
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      
      // PRIMER CLIC
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Error al bloquear el borrador. Revisa tu almacenamiento local.');
      });
      
      // Verificamos que pending_orders está vacío
      expect(Object.keys(dbStore.pending_orders).length).toBe(0);
      
      // SEGUNDO CLIC
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Borrador guardado localmente.');
      });
      
      // Verificamos que pending_orders tiene el registro correctamente
      expect(Object.keys(dbStore.pending_orders).length).toBe(1);
      
      const uuidGenerado = Object.keys(dbStore.pending_orders)[0];
      expect(dbStore.drafts['seller-1']).toBeUndefined(); // Se limpió tras el éxito
  });
});