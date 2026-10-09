import { describe, expect, it } from 'vitest';
import { createScanConfirmation } from '@/lib/scanConfirmation';

describe('confirmación de lectura QR', () => {
  it('acepta la primera lectura válida y bloquea lecturas simultáneas', () => {
    const scan = createScanConfirmation();
    expect(scan.accept('  ARRIBA  ', 1000)).toBe(true);
    expect(scan.accept('ARRIBA', 1100)).toBe(false);
    expect(scan.accept('ABAJO', 1200)).toBe(false);
  });

  it('evita releer enseguida el mismo QR pero permite otro distinto', () => {
    const scan = createScanConfirmation();
    expect(scan.accept('A', 1000)).toBe(true);
    scan.release(1100);
    expect(scan.accept('A', 1500)).toBe(false);
    expect(scan.accept('B', 1500)).toBe(true);
    scan.release(1600);
    expect(scan.accept('B', 2800)).toBe(true);
    scan.reset();
    expect(scan.accept('A', 2900)).toBe(true);
  });
});
