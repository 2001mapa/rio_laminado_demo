export type InventoryPrintOrder = 'recent' | 'location_asc';

const locationCollator = new Intl.Collator('es-CO', { numeric: true, sensitivity: 'base' });

export function orderPrintableProducts<T extends { locationCode?: string | null; sku: string }>(
  products: T[],
  order: InventoryPrintOrder,
): T[] {
  if (order === 'recent') return products;

  return [...products].sort((a, b) => {
    const left = a.locationCode?.trim() ?? '';
    const right = b.locationCode?.trim() ?? '';
    const rank = (value: string) => !value ? 2 : /^\d+$/.test(value) ? 0 : 1;
    const rankDifference = rank(left) - rank(right);
    if (rankDifference) return rankDifference;

    const locationDifference = locationCollator.compare(left, right);
    return locationDifference || locationCollator.compare(a.sku, b.sku);
  });
}
