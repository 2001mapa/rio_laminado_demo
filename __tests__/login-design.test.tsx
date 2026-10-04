import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/login/page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('@/app/actions/auth', () => ({ resolveLoginDestination: vi.fn() }));

describe('Diseño del login', () => {
  it('muestra la identidad RIO y conserva los controles de acceso', () => {
    const { container } = render(<LoginPage />);

    expect(screen.getByRole('img', { name: 'RIO' }).getAttribute('src')).toBe('/icon.svg');
    expect(screen.getByRole('heading', { name: 'Laminado' })).toBeTruthy();
    expect(container.querySelectorAll('h1 span')).toHaveLength(8);
    expect(screen.getByRole('textbox').getAttribute('name')).toBe('username');
    expect(container.querySelector('input[name="password"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeTruthy();
    expect(screen.queryByText('Portal RIO')).toBeNull();
  });
});
