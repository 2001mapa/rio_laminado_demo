import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import PwaUpdater from '@/components/PwaUpdater';

let mockPendingOrders: any[] = [];
let getAuthCalled = false;

vi.mock('@/lib/offlineQueue', () => ({
  getPendingOrders: vi.fn(async () => mockPendingOrders)
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { 
      getUser: async () => {
        getAuthCalled = true;
        return { data: { user: { id: 'auth-user-123' } } };
      }
    }
  })
}));

describe('PwaUpdater Component', () => {
  let mockWorker: any;
  
  afterEach(() => {
    cleanup();
  });
  let workboxEvents: any = {};
  
  beforeEach(() => {
    mockPendingOrders = [];
    getAuthCalled = false;
    workboxEvents = {};
    
    mockWorker = {
      state: 'installed',
      postMessage: vi.fn()
    };

    (global as any).window.workbox = {
        addEventListener: (e: string, cb: any) => { workboxEvents[e] = cb; },
        removeEventListener: vi.fn(),
        getSW: vi.fn().mockResolvedValue(mockWorker)
    };
    
    // location is unconfigurable in JSDOM, we can mock it by deleting and redefining
    delete (global as any).window.location;
    (global as any).window.location = { reload: vi.fn() };
    
    
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
            controller: true,
            addEventListener: vi.fn()
        }
      },
      writable: true,
      configurable: true
    });
  });

  it('1. Muestra el actualizador cuando hay una nueva versión y usa el ID de Auth', async () => {
      render(<PwaUpdater />);
      
      await waitFor(() => {
         expect(screen.getByText(/Nueva versión disponible/i)).toBeTruthy();
      });
      
      expect(getAuthCalled).toBe(true);
      
      await waitFor(() => {
          const btn = screen.getByRole('button', { name: /Actualizar/i });
          expect(btn.hasAttribute('disabled')).toBe(false);
      });
  });

  it('2. Deshabilita la actualización si hay un envío en curso (status: syncing)', async () => {
      mockPendingOrders = [{ status: 'syncing' }];
      render(<PwaUpdater />);
      
      await waitFor(() => {
         expect(screen.getByText(/Nueva versión disponible/i)).toBeTruthy();
         expect(screen.getByText(/Espera a que termine el envío/i)).toBeTruthy();
      });
      
      const btn = screen.getByRole('button', { name: /Actualizar/i });
      expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('3. Envía SKIP_WAITING y espera controllerchange para recargar', async () => {
      let swListener: any;
      global.navigator.serviceWorker.addEventListener = (e: string, cb: any) => {
          if (e === 'controllerchange') swListener = cb;
      };
      
      render(<PwaUpdater />);
      
      await waitFor(() => {
         expect(screen.getByText(/Nueva versión disponible/i)).toBeTruthy();
      });
      
      let btn: any;
      await waitFor(() => {
          btn = screen.getByRole('button', { name: /Actualizar/i });
          expect(btn.hasAttribute('disabled')).toBe(false);
      });
      fireEvent.click(btn);
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Simular la activación del worker
      swListener();
      
      expect((global as any).window.location.reload).toHaveBeenCalled();
  });
});
