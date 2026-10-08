import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PedidoDetalleAdminPage from '@/app/admin/pedidos/[id]/page';

const order = vi.hoisted(() => ({
  id: 'order-label-test',
  number: 'VEN-0004',
  customerId: 'customer-1',
  status: 'Reservado',
  groups: [],
  statusHistory: [],
  items: [{
    id: 'item-1',
    quantity: 1,
    sizeDetails: [{ size: '6', quantity: 1 }],
    product: { sku: 'X0328', name: 'Anillo', category: 'Anillos', locationCode: '1' },
  }],
}));

vi.mock('@/lib/DemoContext', () => ({
  useDemo: () => ({
    orders: [order],
    customers: [{ id: 'customer-1', name: 'Cliente de prueba' }],
    products: [],
    transitionOrder: vi.fn(),
    updateOrder: vi.fn(),
    updateGroupInvoice: vi.fn(),
  }),
}));
vi.mock('@/app/actions/orders', () => ({
  getOrderById: vi.fn().mockResolvedValue({ success: true, order }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('Etiquetas de código de barras del pedido', () => {
  it('muestra solo número de ítem, referencia y cantidad en la cabecera', async () => {
    await act(async () => {
      render(<PedidoDetalleAdminPage params={Promise.resolve({ id: order.id })} />);
    });

    const header = screen.getByTestId('barcode-label-header');
    expect(header.textContent).toBe('#1X0328C:1');
    expect(header.textContent).not.toContain('6x1');
    expect(header.className).toContain('w-fit max-w-[28mm]');
    expect(header.className).toContain('gap-[1mm]');
    expect(header.className).toContain('mb-[0.4mm]');
    expect(header.parentElement?.className).toContain('w-[32mm] h-[16mm]');
    expect(header.nextElementSibling?.className).toContain('w-[28mm] h-[8mm]');
  });
});
