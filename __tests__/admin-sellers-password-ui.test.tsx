import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

const h = vi.hoisted(() => ({
  createSeller: vi.fn(),
  updateSeller: vi.fn(),
  resetSellerPassword: vi.fn(),
}));

vi.mock('@/app/actions/sellers', () => ({
  createSeller: h.createSeller,
  updateSeller: h.updateSeller,
  resetSellerPassword: h.resetSellerPassword,
}));
vi.mock('@/lib/DemoContext', () => ({ useDemo: () => ({ addSeller: vi.fn() }) }));

import SellerModal from '@/components/SellerModal';
import ResetSellerPasswordModal from '@/components/ResetSellerPasswordModal';

const MANUAL = 'Mi Clave Propia7';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
});
afterEach(() => cleanup());

const flush = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });

function fillSeller() {
  fireEvent.change(screen.getByPlaceholderText('Ej. Carlos Martínez'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByPlaceholderText('vendedor@empresa.com'), { target: { value: 'ana@rio.com' } });
}

describe('SellerModal – Nuevo Vendedor', () => {
  it('envía exactamente la contraseña escrita y la muestra solo en la pantalla de éxito', async () => {
    h.createSeller.mockResolvedValueOnce({ success: true, seller: { id: 's1', name: 'Ana', email: 'ana@rio.com', status: 'active' } });
    render(<SellerModal isOpen onClose={vi.fn()} onComplete={vi.fn()} sellerToEdit={null} />);

    fillSeller();
    const pw = screen.getByLabelText(/Contraseña Inicial/i) as HTMLInputElement;
    expect(pw.type).toBe('password');
    fireEvent.change(pw, { target: { value: MANUAL } });

    fireEvent.click(screen.getByLabelText('Mostrar contraseña'));
    expect(pw.type).toBe('text');
    fireEvent.click(screen.getByLabelText('Ocultar contraseña'));
    expect(pw.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: 'Crear Vendedor' }));
    await flush();

    expect(h.createSeller).toHaveBeenCalledWith({ name: 'Ana', email: 'ana@rio.com', password: MANUAL });
    expect(screen.getByText(MANUAL)).toBeTruthy();
    expect(JSON.stringify(localStorage)).not.toContain(MANUAL);
  });

  it('«Generar» solo rellena el campo, que sigue siendo editable', async () => {
    render(<SellerModal isOpen onClose={vi.fn()} onComplete={vi.fn()} sellerToEdit={null} />);
    const pw = screen.getByLabelText(/Contraseña Inicial/i) as HTMLInputElement;

    fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
    expect(pw.value.length).toBeGreaterThanOrEqual(8);
    expect(h.createSeller).not.toHaveBeenCalled();

    fireEvent.change(pw, { target: { value: MANUAL } });
    expect(pw.value).toBe(MANUAL);
  });

  it('bloquea en la UI una clave débil con el mismo mensaje del servidor', async () => {
    render(<SellerModal isOpen onClose={vi.fn()} onComplete={vi.fn()} sellerToEdit={null} />);
    fillSeller();
    fireEvent.change(screen.getByLabelText(/Contraseña Inicial/i), { target: { value: 'abc12345' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Crear Vendedor' }).closest('form')!);
    await flush();

    expect(h.createSeller).not.toHaveBeenCalled();
    expect(screen.getAllByText(/al menos 8 caracteres, una mayúscula, una minúscula y un número/).length).toBeGreaterThan(1);
  });

  it('muestra el error del servidor y no anuncia éxito', async () => {
    h.createSeller.mockResolvedValueOnce({ success: false, message: 'Supabase rechazó la contraseña por su política de seguridad' });
    render(<SellerModal isOpen onClose={vi.fn()} onComplete={vi.fn()} sellerToEdit={null} />);
    fillSeller();
    fireEvent.change(screen.getByLabelText(/Contraseña Inicial/i), { target: { value: MANUAL } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear Vendedor' }));
    await flush();

    expect(screen.getByText(/política de seguridad/)).toBeTruthy();
    expect(screen.queryByText('¡Vendedor Registrado!')).toBeNull();
  });

  it('borra la clave del estado al cerrar', async () => {
    h.createSeller.mockResolvedValueOnce({ success: true, seller: { id: 's1', name: 'Ana', email: 'ana@rio.com', status: 'active' } });
    const onComplete = vi.fn();
    const { rerender } = render(<SellerModal isOpen onClose={vi.fn()} onComplete={onComplete} sellerToEdit={null} />);
    fillSeller();
    fireEvent.change(screen.getByLabelText(/Contraseña Inicial/i), { target: { value: MANUAL } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear Vendedor' }));
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onComplete).toHaveBeenCalled();
    rerender(<SellerModal isOpen={false} onClose={vi.fn()} onComplete={onComplete} sellerToEdit={null} />);
    rerender(<SellerModal isOpen onClose={vi.fn()} onComplete={onComplete} sellerToEdit={null} />);

    expect(screen.queryByText(MANUAL)).toBeNull();
    expect((screen.getByLabelText(/Contraseña Inicial/i) as HTMLInputElement).value).toBe('');
  });

  it('el modo edición no muestra campo de contraseña', () => {
    render(<SellerModal isOpen onClose={vi.fn()} onComplete={vi.fn()} sellerToEdit={{ id: 's1', name: 'Ana', email: 'ana@rio.com', status: 'active' } as any} />);
    expect(screen.queryByLabelText(/Contraseña Inicial/i)).toBeNull();
  });
});

describe('ResetSellerPasswordModal', () => {
  const renderReset = (onClose = vi.fn()) =>
    render(<ResetSellerPasswordModal isOpen onClose={onClose} sellerId="seller-1" sellerName="Ana" />);

  it('exige confirmar la advertencia antes de llamar al servidor', async () => {
    h.resetSellerPassword.mockResolvedValueOnce({ success: true });
    renderReset();

    fireEvent.change(screen.getByLabelText(/Nueva contraseña/i), { target: { value: MANUAL } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await flush();

    expect(h.resetSellerPassword).not.toHaveBeenCalled();
    expect(screen.getByText(/dejará de funcionar de inmediato/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, restablecer' }));
    await flush();

    expect(h.resetSellerPassword).toHaveBeenCalledWith('seller-1', MANUAL);
    expect(screen.getByText('Contraseña restablecida')).toBeTruthy();
    expect(screen.getByText(MANUAL)).toBeTruthy();
  });

  it('un fallo de Auth muestra el error y no anuncia éxito', async () => {
    h.resetSellerPassword.mockResolvedValueOnce({ success: false, message: 'Error de Supabase Auth: down. La contraseña NO fue cambiada.' });
    renderReset();
    fireEvent.change(screen.getByLabelText(/Nueva contraseña/i), { target: { value: MANUAL } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, restablecer' }));
    await flush();

    expect(screen.getByRole('alert').textContent).toMatch(/NO fue cambiada/);
    expect(screen.queryByText('Contraseña restablecida')).toBeNull();
  });

  it('clave débil no avanza a confirmación', async () => {
    renderReset();
    fireEvent.change(screen.getByLabelText(/Nueva contraseña/i), { target: { value: 'debil' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await flush();
    expect(screen.queryByText(/dejará de funcionar/)).toBeNull();
    expect(h.resetSellerPassword).not.toHaveBeenCalled();
  });

  it('borra la clave al cerrar', async () => {
    h.resetSellerPassword.mockResolvedValueOnce({ success: true });
    const onClose = vi.fn();
    const { rerender } = renderReset(onClose);
    fireEvent.change(screen.getByLabelText(/Nueva contraseña/i), { target: { value: MANUAL } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, restablecer' }));
    await flush();

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[0]);
    expect(onClose).toHaveBeenCalled();
    rerender(<ResetSellerPasswordModal isOpen sellerId="seller-1" sellerName="Ana" onClose={onClose} />);
    expect(screen.queryByText(MANUAL)).toBeNull();
    expect((screen.getByLabelText(/Nueva contraseña/i) as HTMLInputElement).value).toBe('');
    expect(JSON.stringify(localStorage)).not.toContain(MANUAL);
  });
});
