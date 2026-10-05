import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, act } from '@testing-library/react';
import { Suspense } from 'react';

const h = vi.hoisted(() => ({
  getSellerProfileOrders: vi.fn(),
  updateSeller: vi.fn(),
  refreshData: vi.fn(),
}));

vi.mock('@/app/actions/sellers', () => ({
  getSellerProfileOrders: h.getSellerProfileOrders,
  updateSeller: h.updateSeller,
}));
vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({
    sellers: [{ id: 'seller-1', name: 'Ana Vendedora', email: 'ana@rio.com', status: 'active', authUserId: 'auth-1' }],
    orders: [],
    onlineUsers: [],
    isLoaded: true,
    refreshData: h.refreshData,
  }),
}));
vi.mock('@/components/SellerModal', () => ({ default: () => null }));
vi.mock('@/components/ResetSellerPasswordModal', () => ({ default: () => null }));
vi.mock('@/lib/toast', () => ({ addToast: vi.fn() }));

import AdminSellerProfilePage from '@/app/admin/vendedores/[id]/page';
import AdminVendedoresPage from '@/app/admin/vendedores/page';

beforeEach(() => {
  vi.clearAllMocks();
  h.getSellerProfileOrders.mockResolvedValue({
    success: true,
    total: 2,
    active: 1,
    nextCursor: null,
    orders: [
      { id: 'order-1', number: 'VEN-0001', status: 'Reservado', createdAt: new Date('2026-10-01'), customerName: 'Cliente Uno', itemCount: 2 },
      { id: 'order-2', number: 'VEN-0002', status: 'Despachado', createdAt: new Date('2026-09-20'), customerName: 'Cliente Dos', itemCount: 1 },
    ],
  });
});
afterEach(() => cleanup());

describe('perfil administrativo del vendedor', () => {
  it('deja la tarjeta limpia y mueve las acciones al perfil con historial completo', async () => {
    render(<AdminVendedoresPage />);
    expect(screen.queryByText('Restablecer contraseña')).toBeNull();
    expect(screen.getByRole('link', { name: /Ver perfil y pedidos/i }).getAttribute('href')).toBe('/admin/vendedores/seller-1');
    cleanup();

    await act(async () => {
      render(<Suspense fallback={<div>Cargando</div>}><AdminSellerProfilePage params={Promise.resolve({ id: 'seller-1' })} /></Suspense>);
    });
    expect(await screen.findByText('VEN-0002')).toBeTruthy();
    expect(h.getSellerProfileOrders).toHaveBeenCalledWith('seller-1');
    expect(screen.getByText('Restablecer contraseña')).toBeTruthy();
    expect(screen.getByText(/Cliente Uno/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /VEN-0002/i }).getAttribute('href')).toBe('/admin/pedidos/order-2');
  });

  it('mantiene funcional la acción de suspender acceso', async () => {
    h.updateSeller.mockResolvedValueOnce({ success: true });
    await act(async () => {
      render(<Suspense fallback={<div>Cargando</div>}><AdminSellerProfilePage params={Promise.resolve({ id: 'seller-1' })} /></Suspense>);
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Suspender acceso' }));
    await waitFor(() => expect(h.updateSeller).toHaveBeenCalledWith('seller-1', {
      name: 'Ana Vendedora', email: 'ana@rio.com', status: 'suspended',
    }));
  });

  it('carga otra página solo cuando el administrador lo pide', async () => {
    h.getSellerProfileOrders.mockResolvedValueOnce({
      success: true, total: 21, active: 21, nextCursor: 'order-20',
      orders: [{ id: 'order-20', number: 'VEN-0020', status: 'Reservado', createdAt: new Date('2026-10-01'), customerName: 'Cliente', itemCount: 1 }],
    }).mockResolvedValueOnce({
      success: true, total: 21, active: 21, nextCursor: null,
      orders: [{ id: 'order-21', number: 'VEN-0021', status: 'Reservado', createdAt: new Date('2026-09-30'), customerName: 'Otro cliente', itemCount: 1 }],
    });
    await act(async () => {
      render(<Suspense fallback={<div>Cargando</div>}><AdminSellerProfilePage params={Promise.resolve({ id: 'seller-1' })} /></Suspense>);
    });
    expect(h.getSellerProfileOrders).toHaveBeenCalledTimes(1);
    fireEvent.click(await screen.findByRole('button', { name: 'Cargar más pedidos' }));
    expect(await screen.findByText('VEN-0021')).toBeTruthy();
    expect(h.getSellerProfileOrders).toHaveBeenCalledWith('seller-1', 'order-20');
    expect(screen.queryByRole('button', { name: 'Cargar más pedidos' })).toBeNull();
  });
});
