import { describe, expect, it, vi } from 'vitest';
import { getPrintableProducts } from '@/app/actions/queries';

const findMany = vi.hoisted(() => vi.fn().mockResolvedValue([{
  id: 'product-1',
  sku: 'X0328',
  name: 'Anillo',
  category: 'Anillos',
  material: 'Laminado',
  price: 49000,
  locationCode: '25',
}]));

vi.mock('next/cache', () => ({ unstable_noStore: vi.fn() }));
vi.mock('@/utils/auth-helpers', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, role: 'admin' }),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { product: { findMany } } }));

describe('Productos para etiquetas', () => {
  it('solicita y entrega la ubicación guardada en el producto', async () => {
    const result = await getPrintableProducts();

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ locationCode: true }),
    }));
    expect(result.success).toBe(true);
    expect(result.products?.[0].locationCode).toBe('25');
  });
});
