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
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Ajustes de Calibración Térmica/i }));

    const content = screen.getAllByTestId('inventory-print-content')[0];
    const qr = screen.getAllByTestId('inventory-print-qr')[0];
    const gridStyle = content.parentElement?.parentElement?.getAttribute('style');
    expect(content.getAttribute('style')).toContain('left: 0mm; top: 0mm');
    expect(qr.getAttribute('style')).toContain('width: 11mm; height: 11mm');
    expect(content.parentElement?.className).toContain('inventory-print-label');

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Tamaño QR (mm)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Mover contenido ↔ (mm)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir Mover contenido ↕ (mm)' }));
    expect(qr.getAttribute('style')).toContain('width: 11.5mm; height: 11.5mm');
    expect(content.getAttribute('style')).toContain('left: 0.2mm; top: -0.2mm');
    expect(content.parentElement?.parentElement?.getAttribute('style')).toBe(gridStyle);

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contenido' }));
    expect(qr.getAttribute('style')).toContain('width: 11mm; height: 11mm');
    expect(content.getAttribute('style')).toContain('left: 0mm; top: 0mm');
  });
});
