import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import PwaUpdater from '@/components/PwaUpdater';

let mockPendingOrders: any[] = [];

vi.mock('@/lib/offlineQueue', () => ({
  getPendingOrders: vi.fn(async () => mockPendingOrders)
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { 
      getUser: async () => ({ data: { user: { id: 'auth-user-123' } } })
    }
  })
}));

describe('PwaUpdater Component', () => {
  let mockWorker: any;
  let workboxEvents: Record<string, any> = {};
  
  beforeEach(() => {
    mockPendingOrders = [];
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

  afterEach(() => {
    cleanup();
  });

  it('1. Muestra el actualizador al disparar el evento waiting de workbox', async () => {
      // Configuramos getSW para que retorne null al inicio, obligando a usar el evento waiting
      (global as any).window.workbox.getSW = vi.fn().mockResolvedValue(null);
      
      render(<PwaUpdater />);
      
      // Al inicio no hay UI
      expect(screen.queryByText(/Nueva versión disponible/i)).toBeNull();

      // Disparamos el evento waiting
      if (workboxEvents['waiting']) {
         workboxEvents['waiting']({ sw: mockWorker });
      }

      await waitFor(() => {
         expect(screen.getByText(/Nueva versión disponible/i)).toBeTruthy();
      });
      
      const btn = screen.getByRole('button', { name: /Actualizar/i });
      expect(btn.hasAttribute('disabled')).toBe(false);
  });

  it('2. Deshabilita la actualización mientras se guarda un borrador (eventos window)', async () => {
      render(<PwaUpdater />);
      
      if (workboxEvents['waiting']) {
         workboxEvents['waiting']({ sw: mockWorker });
      }
      
      await waitFor(() => {
         expect(screen.getByText(/Nueva versión disponible/i)).toBeTruthy();
      });

      // Disparamos evento draft-saving
      fireEvent(window, new Event('draft-saving'));
      
      await waitFor(() => {
         expect(screen.getByText(/Guardando borrador/i)).toBeTruthy();
      });
      
      const btn = screen.getByRole('button', { name: /Actualizar/i });
      expect(btn.hasAttribute('disabled')).toBe(true);

      // Simulamos que terminó
      fireEvent(window, new Event('draft-saved'));
      
      await waitFor(() => {
         expect(screen.queryByText(/Guardando borrador/i)).toBeNull();
         expect(btn.hasAttribute('disabled')).toBe(false);
      });
  });

  it('3. Envía SKIP_WAITING y NO recarga hasta que controllerchange dispare (sin temporizador ciego)', async () => {
      let swListener: any;
      global.navigator.serviceWorker.addEventListener = (e: string, cb: any) => {
          if (e === 'controllerchange') swListener = cb;
      };
      
      render(<PwaUpdater />);
      
      if (workboxEvents['waiting']) {
         workboxEvents['waiting']({ sw: mockWorker });
      }
      
      let btn: any;
      await waitFor(() => {
          btn = screen.getByRole('button', { name: /Actualizar/i });
          expect(btn.hasAttribute('disabled')).toBe(false);
      });
      
      fireEvent.click(btn);
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      
      // Aseguramos que reload NO fue llamado inmediatamente
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Simulamos que el worker se activó y disparó el evento
      swListener();
      
      // AHORA debe recargar
      expect((global as any).window.location.reload).toHaveBeenCalledTimes(1);
  });
});
