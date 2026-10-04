import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
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
    const metadata = await sharp(join(process.cwd(), 'public', file)).metadata();
    expect([metadata.width, metadata.height]).toEqual([size, size]);
  });

  it('incluye un favicon ICO con tres tamaños', async () => {
    const ico = await readFile(join(process.cwd(), 'src', 'app', 'favicon.ico'));
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(3);
  });
});
