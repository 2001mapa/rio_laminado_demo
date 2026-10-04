import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const icon = await readFile(new URL('../public/icon.svg', import.meta.url));
const maskableIcon = await readFile(new URL('../public/icon-maskable.svg', import.meta.url));

const png = (source, size) => sharp(source).resize(size, size).png().toBuffer();

await Promise.all([
  writeFile(new URL('../public/icon-192.png', import.meta.url), await png(maskableIcon, 192)),
  writeFile(new URL('../public/icon-512.png', import.meta.url), await png(icon, 512)),
  writeFile(new URL('../public/apple-icon.png', import.meta.url), await png(icon, 180)),
]);

// ICO files can contain PNG images; bundle multiple sizes for browser tabs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => png(icon, size)));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(sizes[index], entry);
  header.writeUInt8(sizes[index], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), Buffer.concat([header, ...images]));
