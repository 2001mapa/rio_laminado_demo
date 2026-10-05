import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ConfirmDialog from '@/components/ConfirmDialog';
import ToastContainer from '@/components/ToastContainer';
import { confirmRio } from '@/lib/confirm';
import { addToast } from '@/lib/toast';

describe('avisos RIO', () => {
  it('pide confirmación personalizada y cancelar nunca ejecuta la acción', async () => {
    render(<ConfirmDialog />);
    let decision!: Promise<boolean>;
    await act(async () => {
      decision = confirmRio({ title: 'Cancelar pedido', description: 'Se liberarán las unidades.', confirmLabel: 'Cancelar pedido', tone: 'danger' });
    });
    expect(screen.getByRole('alertdialog', { name: 'Cancelar pedido' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await expect(decision).resolves.toBe(false);

    await act(async () => {
      decision = confirmRio({ title: 'Descartar borrador', description: 'Se eliminará de la cola.', confirmLabel: 'Descartar', tone: 'danger' });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    await expect(decision).resolves.toBe(true);
  });

  it('muestra avisos informativos y de error con el diseño de la app', () => {
    render(<ToastContainer />);
    act(() => {
      addToast('Catálogo actualizado');
      addToast('No se pudo guardar', 'error');
    });
    expect(screen.getByRole('status').textContent).toContain('Catálogo actualizado');
    expect(screen.getByRole('alert').textContent).toContain('No se pudo guardar');
  });
});
