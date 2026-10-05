import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import PrintableOrderPage from '@/app/admin/pedidos/[id]/imprimir/page';

const printOrder = vi.hoisted(() => ({
  id: 'order-print-test',
  number: 'VEN-0105',
  customerId: 'customer-print-test',
  customer: { name: 'Joyería de Prueba', city: 'Medellín', address: 'Calle 1' },
  createdAt: '2026-10-03T12:00:00.000Z',
  items: Array.from({ length: 105 }, (_, index) => ({
    id: `item-${index + 1}`,
    quantity: 1,
    sizeDetails: [{ size: '7', quantity: 1 }],
    product: {
      sku: `REF-${String(index + 1).padStart(3, '0')}`,
      name: `Artículo ${index + 1}`,
      locationCode: index < 6 ? ['1', '12', '13', '25', '3', '4'][index] : String(index + 100),
      imageUrl: null,
    },
  })),
}));

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({ orders: [printOrder], customers: [], products: [] }),
}));

vi.mock('@/app/actions/orders', () => ({
  getOrderById: vi.fn().mockResolvedValue({ success: true, order: printOrder }),
}));

describe('Hoja de pedido imprimible', () => {
  it('conserva 105 referencias completas y deja totales y firma una sola vez al final', async () => {
    let container!: HTMLElement;
    await act(async () => {
      container = render(
        <PrintableOrderPage params={Promise.resolve({ id: printOrder.id })} />,
      ).container;
    });

    await waitFor(() => expect(container.querySelectorAll('tbody tr')).toHaveLength(105));

    expect(Array.from(container.querySelectorAll('tbody tr')).slice(0, 6).map(row => row.children[1].textContent))
      .toEqual(['1', '3', '4', '12', '13', '25']);

    expect(screen.getByText('VEN-0105')).toBeTruthy();
    expect(screen.getByText('Joyería de Prueba')).toBeTruthy();
    expect(screen.getByText('REF-105')).toBeTruthy();
    expect(screen.queryByText(/Ordenado por recorrido de bodega/i)).toBeNull();
    expect(screen.getAllByText('Preparado por')).toHaveLength(1);
    expect(screen.getByText('UNIDADES:').parentElement?.textContent).toContain('105');
    expect(screen.getByRole('link', { name: 'Volver al pedido' }).getAttribute('href')).toBe(`/admin/pedidos/${printOrder.id}`);
    expect(screen.getByRole('button', { name: 'Imprimir hoja' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Vista previa de hoja de bodega' })).toBeTruthy();
  });
});
