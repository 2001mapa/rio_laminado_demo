import { describe, expect, it } from 'vitest';
import { createScanConfirmation } from '@/lib/scanConfirmation';

describe('confirmación de lectura QR', () => {
  it('ignora un código fugaz al pasar a otra referencia', () => {
    const scan = createScanConfirmation();
    expect(scan.accept('ARRIBA', 1000)).toBe(false);
    expect(scan.accept('ABAJO', 1100)).toBe(false);
    expect(scan.accept('ABAJO', 1250)).toBe(false);
    expect(scan.accept('ABAJO', 1420)).toBe(true);
  });

  it('descarta lecturas interrumpidas y no confirma una sola imagen', () => {
    const scan = createScanConfirmation();
    expect(scan.accept('A', 1000)).toBe(false);
    expect(scan.accept('A', 1700)).toBe(false);
    expect(scan.accept('A', 1850)).toBe(false);
    scan.reset();
    expect(scan.accept('A', 2100)).toBe(false);
  });
});
