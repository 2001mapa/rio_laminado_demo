import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('Identidad RIO', () => {
  it('usa RIO como nombre de la app instalable', () => {
    const appManifest = manifest();
    expect(appManifest.name).toBe('RIO');
    expect(appManifest.short_name).toBe('RIO');
    expect(appManifest.icons?.map(icon => icon.src)).toEqual(['/icon-192.png', '/icon-512.png']);
  });

  it.each([
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['apple-icon.png', 180],
  ])('genera %s con tamaño %i px', async (file, size) => {
    const png = await readFile(join(process.cwd(), 'public', file));
    expect(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([size, size]);
  });

  it('incluye un favicon ICO con tres tamaños', async () => {
    const ico = await readFile(join(process.cwd(), 'src', 'app', 'favicon.ico'));
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(3);
  });
});
