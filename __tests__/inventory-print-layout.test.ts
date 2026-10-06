import { describe, expect, it } from 'vitest';
import { INVENTORY_LABELS_PER_SHEET, splitInventoryLabelsIntoSheets } from '@/lib/inventoryPrintLayout';

describe('lotes físicos de etiquetas de inventario', () => {
  it.each([
    [27, [27]],
    [54, [27, 27]],
    [81, [27, 27, 27]],
    [28, [27, 1]],
  ])('distribuye %i etiquetas en páginas de 27', (count, expected) => {
    const labels = Array.from({ length: count }, (_, index) => index);
    const sheets = splitInventoryLabelsIntoSheets(labels);
    expect(sheets.map(sheet => sheet.length)).toEqual(expected);
    expect(sheets.flat()).toEqual(labels);
  });

  it('no crea una hoja vacía', () => {
    expect(INVENTORY_LABELS_PER_SHEET).toBe(27);
    expect(splitInventoryLabelsIntoSheets([])).toEqual([]);
  });
});
