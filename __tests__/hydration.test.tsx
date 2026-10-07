import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import NuevaVentaPage from '@/app/vendedor/nueva-venta/page';
import * as offlineQueue from '@/lib/offlineQueue';

// Mock dependencies
let mockDraft: any = undefined;
let mockCustomers: any[] = [];

vi.mock('@/lib/offlineQueue', () => ({
  getPendingOrders: vi.fn().mockResolvedValue([]),
  removePendingOrder: vi.fn(),
  addPendingOrder: vi.fn(),
  clearDraft: vi.fn().mockImplementation(async () => { mockDraft = undefined; }),
  saveDraft: vi.fn().mockImplementation(async (draft) => { mockDraft = draft; }),
  loadDraft: vi.fn().mockImplementation(() => Promise.resolve(mockDraft)),
  getDB: async () => null,
  searchOfflineProducts: async () => [],
  searchOfflineCustomers: async () => [],
  getOfflineProductsByIds: async () => []
}));

vi.mock('@/app/actions/queries', () => ({
  getProductsByIds: vi.fn().mockImplementation(async (ids: string[]) => {
    // Simular que el servidor responde con el producto XO397
    if (ids.includes('prod-xo397')) {
      return {
        success: true,
        products: [
          { id: 'prod-xo397', sku: 'XO397', name: 'Anillo de Prueba', category: 'Anillos', price: 100, physicalStock: 10, reservedStock: 0 }
        ]
      };
    }
    return { success: true, products: [] };
  }),
  getExactProductBySku: vi.fn(),
  getPagedCatalog: vi.fn()
}));

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({
    customers: mockCustomers,
    products: [], // El catálogo inicial está vacío (parcial)
    checkoutSeller: async () => {},
    syncPendingOrders: async () => {}
  })
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'seller-angel' } } }) }
  })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} })
}));

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class { start(){} stop(){} clear(){} static getCameras(){ return Promise.resolve([]); } }
}));

describe('Flujo de Borrador e Hidratación', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockCustomers = [{ id: 'C1', name: 'Joyería de Prueba', email: 'test@joyeria.com' }];
    // 1. Estado inicial simulado del borrador (como si el vendedor Ángel hubiera agregado y recargado)
    mockDraft = {
      sellerId: 'seller-angel',
      selectedClientId: 'C1',
      cart: [
        {
          productId: 'prod-xo397', // Producto no presente en products[] de DemoContext
          quantity: 1,
          sizes: [{ size: '7', quantity: 1 }]
        }
      ],
      updatedAt: Date.now()
    };
  });

  it('debe restaurar el cliente, producto y talla haciendo fetch al servidor si falta en el contexto', async () => {
    // 2. Montamos el componente (simulando "recargar" o "remontar")
    render(<NuevaVentaPage />);

    // 3. Verificamos que se haya cargado el cliente y saltado al paso 2
    // El paso 2 muestra el resumen del pedido o el catálogo. 
    // Comprobamos si el cliente seleccionado aparece y si el carrito se restauró.
    await waitFor(() => {
      // Debería mostrar el botón para cambiar el cliente en el Paso 2.
      expect(screen.queryByText('Cambiar cliente')).not.toBeNull();
    });

    // 4. Verificamos que el producto "XO397" esté en el carrito (nombre: Anillo de Prueba)
    await waitFor(() => {
      expect(screen.queryByText('Anillo de Prueba')).not.toBeNull();
    });

    // 5. Verificamos que la talla se haya restaurado
    expect(screen.queryByText(/T7/)).not.toBeNull();
    
    // 6. Comprobamos que saveDraft NO se haya llamado durante la hidratación inicial para borrarlo
    expect(offlineQueue.clearDraft).not.toHaveBeenCalled();
  });

  it('restaura un cliente nuevo aunque no se haya descargado el catálogo de clientes', async () => {
    mockCustomers = [];
    mockDraft.selectedClientId = undefined;
    mockDraft.newCustomerData = { name: 'Joyería Nueva', phone: '3124560359', city: 'Medellín', address: 'Calle 10 # 20-30' };

    render(<NuevaVentaPage />);
    await waitFor(() => expect(screen.getByText('Joyería Nueva')).toBeTruthy());
    expect(screen.getByText('Anillo de Prueba')).toBeTruthy();
    expect(offlineQueue.clearDraft).not.toHaveBeenCalled();
  });
});
