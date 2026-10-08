import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MassPrintPage from '@/app/admin/inventario/imprimir/page';

vi.mock('@/lib/DemoContext', () => ({ useDemo: () => ({}) }));
vi.mock('@/app/actions/queries', () => ({
  getPrintableProducts: vi.fn().mockResolvedValue({
    success: true,
    products: [{ id: 'product-1', sku: 'YL0300-2', name: 'Anillo', price: 98000, locationCode: '1', material: 'Laminado', category: 'Anillos' }],
  }),
}));

afterEach(cleanup);

describe('calibración de QR de inventario', () => {
  it('ajusta QR y contenido sin modificar tamaño de etiqueta ni cuadrícula', async () => {
    render(<MassPrintPage />);
    await waitFor(() => expect(screen.getByText('YL0300-2')).toBeTruthy());
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('1');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Ajustes de Calibración Térmica/i }));

    const content = screen.getAllByTestId('inventory-print-content')[0];
    const qr = screen.getAllByTestId('inventory-print-qr')[0];
    const gridStyle = content.parentElement?.parentElement?.getAttribute('style');
    expect(content.getAttribute('style')).toContain('left: 1.5mm; top: -1.5mm');
    expect(qr.getAttribute('style')).toContain('width: 11mm; height: 11mm');
    expect(content.parentElement?.className).toContain('inventory-print-label');
    expect(gridStyle).toContain('left: 6.5mm; top: 0mm; row-gap: 3mm; column-gap: 3mm');
    expect(screen.getAllByTestId('inventory-print-qr')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Tamaño QR (mm)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir Mover contenido ↔ (mm)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Mover contenido ↕ (mm)' }));
    expect(qr.getAttribute('style')).toContain('width: 11.5mm; height: 11.5mm');
    expect(content.getAttribute('style')).toContain('left: 1.3mm; top: -1.3mm');
    expect(content.parentElement?.parentElement?.getAttribute('style')).toBe(gridStyle);

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contenido' }));
    expect(qr.getAttribute('style')).toContain('width: 11mm; height: 11mm');
    expect(content.getAttribute('style')).toContain('left: 1.5mm; top: -1.5mm');

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    expect(screen.getAllByTestId('inventory-print-qr')).toHaveLength(2);
  });
});
