import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(cleanup);

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
    const content = screen.getByTestId('barcode-label-content');
    expect(content).toHaveProperty('style');
    expect(content.getAttribute('style')).toContain('left: 1.5mm; top: -2mm');
    expect(content.parentElement?.className).toContain('w-[32mm] h-[15mm]');
    expect(content.parentElement?.className).toContain('justify-center');
    expect(screen.getByTestId('barcode-label-image').getAttribute('style')).toContain('width: 27mm; height: 7.5mm');
    expect(content.parentElement?.parentElement?.getAttribute('style')).toContain('padding-top: 0mm');
  });

  it('ajusta tamaño y posición interna sin mover la cuadrícula', async () => {
    await act(async () => {
      render(<PedidoDetalleAdminPage params={Promise.resolve({ id: order.id })} />);
    });
    const grid = screen.getByTestId('barcode-label-content').parentElement?.parentElement;
    const initialGridStyle = grid?.getAttribute('style');
    fireEvent.click(screen.getByRole('button', { name: /Ajustar impresión/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Ancho código' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir Alto código' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir Mover contenido ↔' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir Mover contenido ↕' }));
    expect(screen.getByTestId('barcode-label-image').getAttribute('style')).toContain('width: 27.2mm; height: 7.3mm');
    expect(screen.getByTestId('barcode-label-content').getAttribute('style')).toContain('left: 1.3mm; top: -2.5mm');
    for (let index = 0; index < 8; index++) {
      fireEvent.click(screen.getByRole('button', { name: 'Disminuir Mover contenido ↕' }));
    }
    expect(screen.getByTestId('barcode-label-content').getAttribute('style')).toContain('top: -4mm');
    expect(grid?.getAttribute('style')).toBe(initialGridStyle);
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contenido' }));
    expect(screen.getByTestId('barcode-label-content').getAttribute('style')).toContain('left: 1.5mm; top: -2mm');
    expect(screen.getByTestId('barcode-label-image').getAttribute('style')).toContain('width: 27mm; height: 7.5mm');
  });

  it('solicita una página corta solo cuando el lote cabe en un bloque', async () => {
    await act(async () => {
      render(<PedidoDetalleAdminPage params={Promise.resolve({ id: order.id })} />);
    });
    expect(screen.getByTestId('order-print-page-rule').textContent).toContain('size: 103mm auto');
    fireEvent.click(screen.getByRole('checkbox', { name: /Probar ahorro de rollo/i }));
    expect(screen.getByTestId('order-print-page-rule').textContent).toContain('size: 103mm 110mm');
    expect(document.querySelector('.order-label-sheet')?.getAttribute('style')).toContain('height: 110mm');
  });

  it('imprime únicamente el lote actual y divide lotes grandes en hojas de 27', async () => {
    const originalItems = order.items;
    order.items = Array.from({ length: 60 }, (_, index) => ({
      ...originalItems[0], id: `item-${index + 1}`,
      product: { ...originalItems[0].product, sku: `X${String(index + 1).padStart(4, '0')}` },
    }));
    try {
      await act(async () => {
        render(<PedidoDetalleAdminPage params={Promise.resolve({ id: order.id })} />);
      });
      expect(screen.getAllByTestId('barcode-label-image')).toHaveLength(27);
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      expect(screen.getAllByTestId('barcode-label-image')).toHaveLength(27);
      expect(screen.getByText('Lote 2 de 3')).toBeTruthy();
      fireEvent.change(screen.getByLabelText('Tamaño del lote de etiquetas'), { target: { value: '54' } });
      expect(screen.getAllByTestId('barcode-label-image')).toHaveLength(54);
      expect(document.querySelectorAll('.order-label-sheet')).toHaveLength(2);
      fireEvent.click(screen.getByRole('checkbox', { name: /Probar ahorro de rollo/i }));
      expect(screen.getByTestId('order-print-page-rule').textContent).toContain('size: 103mm auto');
      expect(screen.getByRole('status').textContent).toContain('impresión normal');
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      expect(screen.getAllByTestId('barcode-label-image')).toHaveLength(6);
      expect(screen.getByTestId('order-print-page-rule').textContent).toContain('size: 103mm 110mm');
    } finally {
      order.items = originalItems;
    }
  });
});
