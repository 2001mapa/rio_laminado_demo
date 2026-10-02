import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
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

describe('PwaUpdater Component (Seguridad de Escritura)', () => {
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
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    cleanup();
    
  });

  it('1. Bloquea actualización si hay dos escrituras simultáneas y libera cuando AMBAS terminan', async () => {
      render(<PwaUpdater />);
      if (workboxEvents['waiting']) workboxEvents['waiting']({ sw: mockWorker });
      
      await waitFor(() => {
         expect(screen.getByText(/Nueva versin disponible/i)).toBeTruthy();
      });

      // Primer write
      act(() => { fireEvent(window, new Event('idb-write-start')); });
      
      await waitFor(() => {
         expect(screen.getByText(/Guardando/i)).toBeTruthy();
         const btn = screen.getByRole('button', { name: /Actualizar/i });
         expect(btn.hasAttribute('disabled')).toBe(true);
      });

      // Segundo write (ej: saveDraft y clearDraft solapados)
      act(() => { fireEvent(window, new Event('idb-write-start')); });
      
      // Termina el primero
      act(() => { fireEvent(window, new CustomEvent('idb-write-end', { detail: { success: true } })); });
      
      // Aún debe estar bloqueado
      await waitFor(() => {
         expect(screen.getByRole('button', { name: /Actualizar/i }).hasAttribute('disabled')).toBe(true);
      });

      // Termina el segundo
      act(() => { fireEvent(window, new CustomEvent('idb-write-end', { detail: { success: true } })); });
      
      await waitFor(() => {
         expect(screen.queryByText(/Guardando/i)).toBeNull();
         expect(screen.getByRole('button', { name: /Actualizar/i }).hasAttribute('disabled')).toBe(false);
      });
  });

  it('2. Actualización solicitada se suspende y luego recarga RÁPIDO si controllerchange dispara', async () => {
      let swListener: any;
      global.navigator.serviceWorker.addEventListener = (e: string, cb: any) => {
          if (e === 'controllerchange') swListener = cb;
      };
      
      render(<PwaUpdater />);
      if (workboxEvents['waiting']) workboxEvents['waiting']({ sw: mockWorker });
      
      let btn: any;
      await waitFor(() => {
          btn = screen.getByRole('button', { name: /Actualizar/i });
      });
      
      fireEvent.click(btn);
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Disparo rápido
      act(() => { swListener(); });
      
      expect((global as any).window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('3. Muestra error si controllerchange NUNCA dispara (ausente) y permite reintento', async () => {
      
      let swListener: any;
      global.navigator.serviceWorker.addEventListener = (e: string, cb: any) => {
          if (e === 'controllerchange') swListener = cb;
      };
      
      render(<PwaUpdater />);
      if (workboxEvents['waiting']) workboxEvents['waiting']({ sw: mockWorker });
      
      let btn: any;
      await waitFor(() => {
          btn = screen.getByRole('button', { name: /Actualizar/i });
      });
      
      vi.useFakeTimers();
      fireEvent.click(btn);
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Pasan 5 segundos y controllerchange NUNCA se disparó
      act(() => { vi.advanceTimersByTime(5000); });
      
      // NUNCA recarga a ciegas
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Muestra la opción de reintento
      expect(screen.getByText(/Error al activar. Reintentar/i)).toBeTruthy();
      vi.useRealTimers();
      
      // El botón vuelve a estar habilitado
      expect(btn.hasAttribute('disabled')).toBe(false);
      expect(btn.textContent).toContain('Actualizar');
  });
});
