import { describe, expect, it } from 'vitest';
import { orderPrintableProducts } from '../src/lib/inventoryPrintOrder';

const products = [
  { sku: 'SIN', locationCode: null },
  { sku: 'TEXT-10', locationCode: 'A-10' },
  { sku: 'NUM-10', locationCode: '10' },
  { sku: 'NUM-2', locationCode: '2' },
  { sku: 'TEXT-2', locationCode: 'A-2' },
  { sku: 'VACIA', locationCode: ' ' },
];

describe('orden de impresión de etiquetas', () => {
  it('mantiene el orden habitual sin modificar el catálogo original', () => {
    expect(orderPrintableProducts(products, 'recent')).toEqual(products);
  });

  it('ordena ubicaciones numéricas naturalmente y deja las vacías al final', () => {
    const ordered = orderPrintableProducts(products, 'location_asc');
    expect(ordered.map(product => product.sku)).toEqual([
      'NUM-2', 'NUM-10', 'TEXT-2', 'TEXT-10', 'SIN', 'VACIA',
    ]);
    expect(products[0].sku).toBe('SIN');
  });
});
