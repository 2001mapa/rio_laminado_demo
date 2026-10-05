import { afterEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VendedorPerfilPage from '@/app/vendedor/perfil/page';
import VendedorPedidoDetallePage from '@/app/vendedor/pedido/[id]/page';

const seller = { id: 'seller-1', name: 'Angel Paz', email: 'seller@example.com', status: 'active' };
const customers = [{ id: 'customer-1', name: 'Joyería Uno' }, { id: 'customer-2', name: 'Joyería Dos' }];
const orders = [
  { id: 'order-1', number: 'VEN-0001', sellerId: seller.id, customerId: 'customer-1', customer: customers[0], status: 'Reservado', createdAt: '2026-10-03T12:00:00', items: [{ id: 'item-1', productId: 'p1', quantity: 2, product: { sku: 'X0328', name: 'Anillo laminado' }, sizeDetails: [{ size: '6', quantity: 2 }] }] },
  { id: 'order-2', number: 'VEN-0002', sellerId: seller.id, customerId: 'customer-2', customer: customers[1], status: 'Despachado', createdAt: '2026-09-18T12:00:00', items: [] },
  { id: 'foreign-order', number: 'OTRO-001', sellerId: 'seller-2', customerId: 'customer-2', customer: customers[1], status: 'Reservado', createdAt: '2026-10-03T12:00:00', items: [] },
];

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({ currentSeller: seller, customers, orders, isLoaded: true }),
}));

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { signOut: async () => {} } }) }));
afterEach(() => cleanup());

describe('Consulta de pedidos del vendedor', () => {
  it('filtra por cliente y por mes sin mostrar pedidos de otro vendedor', () => {
    render(<VendedorPerfilPage />);
    expect(screen.getByText('VEN-0001')).toBeTruthy();
    expect(screen.getByText('VEN-0002')).toBeTruthy();
    expect(screen.queryByText('OTRO-001')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Buscar venta...'), { target: { value: 'Joyeria Uno' } });
    expect(screen.getByText('VEN-0001')).toBeTruthy();
    expect(screen.queryByText('VEN-0002')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Buscar venta...'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Filtrar por'), { target: { value: 'month' } });
    fireEvent.change(screen.getByLabelText('Seleccionar mes'), { target: { value: '2026-09' } });
    expect(screen.getByText('VEN-0002')).toBeTruthy();
    expect(screen.queryByText('VEN-0001')).toBeNull();

    fireEvent.change(screen.getByLabelText('Filtrar por'), { target: { value: 'day' } });
    fireEvent.change(screen.getByLabelText('Seleccionar día'), { target: { value: '2026-10-03' } });
    expect(screen.getByText('VEN-0001')).toBeTruthy();
    expect(screen.queryByText('VEN-0002')).toBeNull();
  });

  it('muestra las referencias propias y rechaza un ID ajeno', async () => {
    let mounted: ReturnType<typeof render> | undefined;
    await act(async () => { mounted = render(<Suspense fallback={<p>Cargando</p>}><VendedorPedidoDetallePage params={Promise.resolve({ id: 'order-1' })} /></Suspense>); });
    await waitFor(() => expect(screen.getByText('X0328')).toBeTruthy());
    expect(screen.getByText('Anillo laminado')).toBeTruthy();
    expect(screen.getByText('Joyería Uno')).toBeTruthy();
    mounted?.unmount();

    await act(async () => { render(<Suspense fallback={<p>Cargando</p>}><VendedorPedidoDetallePage params={Promise.resolve({ id: 'foreign-order' })} /></Suspense>); });
    await waitFor(() => expect(screen.getByText('No se encontró este pedido entre tus ventas.')).toBeTruthy());
    expect(screen.queryByText('OTRO-001')).toBeNull();
  });
});
