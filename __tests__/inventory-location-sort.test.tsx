import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InventarioPage from '@/app/admin/inventario/page';

const calls = vi.hoisted(() => ({ getPagedCatalog: vi.fn() }));

vi.mock('@/lib/DemoContext', () => ({ useDemo: () => ({ refreshData: vi.fn() }) }));
vi.mock('@/components/CSVImporter', () => ({ default: () => null }));
vi.mock('@/components/BulkPhotoUploader', () => ({ default: () => null }));
vi.mock('@/components/CreateProductModal', () => ({ default: () => null }));
vi.mock('@/app/actions/queries', () => ({
  getPagedCatalog: calls.getPagedCatalog,
  getAdminMaterialCounts: async () => ({ success: true, counts: { Todos: 0 } }),
  getDuplicateLocationsCount: async () => ({ success: true, locations: [] }),
}));

describe('orden del inventario', () => {
  beforeEach(() => {
    calls.getPagedCatalog.mockReset().mockResolvedValue({ success: true, products: [], hasMore: false });
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  it('solicita al servidor la ubicación ascendente en vez de ordenar solo la página visible', async () => {
    render(<InventarioPage />);
    await waitFor(() => expect(calls.getPagedCatalog).toHaveBeenCalledWith(expect.objectContaining({ sortBy: undefined })));
    fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar inventario' }), { target: { value: 'location_asc' } });
    await waitFor(() => expect(calls.getPagedCatalog).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'location_asc', cursor: undefined })));
  });
});
