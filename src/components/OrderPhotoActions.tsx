'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Images, Share2 } from 'lucide-react';

type PhotoItem = {
  product?: { sku?: string; name?: string; imageUrl?: string | null; hoverImageUrl?: string | null } | null;
};

type Photo = { sku: string; name: string; url: string; filename: string; variant: number };

function photoFilename(sku: string, url: string, variant: number) {
  const safeSku = sku.replace(/[^a-zA-Z0-9_-]/g, '_');
  const extension = new URL(url).pathname.match(/\.(jpe?g|png|webp|avif)$/i)?.[1]?.toLowerCase() || 'webp';
  return `${safeSku}${variant === 2 ? '_2' : ''}.${extension === 'jpeg' ? 'jpg' : extension}`;
}

function downloadUrl(photo: Photo) {
  const url = new URL(photo.url);
  url.searchParams.set('download', photo.filename);
  return url.toString();
}

function saveBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export default function OrderPhotoActions({ orderNumber, items }: { orderNumber: string; items: PhotoItem[] }) {
  const photos = useMemo(() => {
    const bySku = new Map<string, Photo[]>();
    for (const item of items) {
      const product = item.product;
      if (!product?.sku || bySku.has(product.sku)) continue;
      const productPhotos: Photo[] = [];
      for (const [index, url] of [product.imageUrl, product.hoverImageUrl].entries()) {
        if (!url || productPhotos.some(photo => photo.url === url)) continue;
        try {
          productPhotos.push({
            sku: product.sku,
            name: product.name || product.sku,
            url,
            filename: photoFilename(product.sku, url, index + 1),
            variant: index + 1,
          });
        } catch {
          // An invalid image URL cannot be downloaded.
        }
      }
      bySku.set(product.sku, productPhotos);
    }
    return [...bySku.values()].flat();
  }, [items]);

  const [canShareFiles, setCanShareFiles] = useState(false);
  const [preparedFiles, setPreparedFiles] = useState<File[] | null>(null);
  const [busy, setBusy] = useState<'prepare' | 'zip' | 'share' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPreparedFiles(null);
    setMessage('');
  }, [photos]);

  useEffect(() => {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return;
    const sample = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
    setCanShareFiles(navigator.canShare({ files: [sample] }));
  }, []);

  async function loadFiles() {
    const files: File[] = [];
    for (const photo of photos) {
      const response = await fetch(photo.url);
      if (!response.ok) throw new Error(`No se pudo descargar la foto ${photo.sku}.`);
      const blob = await response.blob();
      files.push(new File([blob], photo.filename, { type: blob.type || 'image/webp' }));
    }
    return files;
  }

  async function handleShare() {
    if (busy) return;
    if (!preparedFiles) {
      setBusy('prepare');
      setMessage('');
      try {
        const files = await loadFiles();
        if (!navigator.canShare({ files })) throw new Error('Este dispositivo no permite compartir todas las fotos juntas. Puedes descargarlas una por una.');
        setPreparedFiles(files);
        setMessage('Fotos listas. Toca “Compartir fotos” para elegir dónde enviarlas.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudieron preparar las fotos.');
      } finally {
        setBusy(null);
      }
      return;
    }

    setBusy('share');
    try {
      await navigator.share({ files: preparedFiles, title: `Fotos del pedido ${orderNumber}` });
      setMessage('Fotos compartidas.');
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setMessage('No se pudieron compartir desde este dispositivo. Puedes descargarlas aquí.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleZip() {
    if (busy) return;
    setBusy('zip');
    setMessage('');
    try {
      const files = preparedFiles || await loadFiles();
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      files.forEach(file => zip.file(file.name, file));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      saveBlob(blob, `fotos-pedido-${orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
      setMessage(`${files.length} fotos descargadas en un ZIP.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron descargar las fotos.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-rio-border bg-white p-4 shadow-sm print:hidden sm:p-5">
      <div className="flex items-center gap-2">
        <Images className="h-5 w-5 text-rio-gold-dark" />
        <h2 className="text-base font-bold text-rio-ink">Fotos del pedido</h2>
      </div>
      {photos.length === 0 ? (
        <p className="mt-3 text-sm text-rio-muted">Este pedido todavía no tiene fotos disponibles.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-rio-muted">Guarda una foto o compártelas desde tu teléfono. Se usan las fotos actuales del catálogo.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {canShareFiles && (
              <button type="button" onClick={handleShare} disabled={busy !== null} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rio-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                <Share2 className="h-4 w-4" />
                {busy === 'prepare' ? 'Preparando fotos...' : preparedFiles ? 'Compartir fotos' : 'Preparar para compartir'}
              </button>
            )}
            <button type="button" onClick={handleZip} disabled={busy !== null} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rio-border px-4 py-2 text-sm font-semibold text-rio-ink disabled:opacity-50">
              <Download className="h-4 w-4" />
              {busy === 'zip' ? 'Preparando ZIP...' : 'Descargar todas (ZIP)'}
            </button>
          </div>
          <div className="mt-4 divide-y divide-rio-border border-t border-rio-border">
            {photos.map(photo => (
              <div key={photo.filename} className="flex min-w-0 items-center gap-3 py-3">
                <img src={photo.url} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg border border-rio-border object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-rio-ink">{photo.name}</p>
                  <p className="text-xs text-rio-muted">{photo.sku}{photo.variant === 2 ? ' · Foto 2' : ''}</p>
                </div>
                <a href={downloadUrl(photo)} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg border border-rio-border px-2.5 text-xs font-semibold text-rio-ink hover:bg-rio-surface-muted" aria-label={`Descargar foto de ${photo.sku}`}>
                  <Download className="h-4 w-4" /> Foto
                </a>
              </div>
            ))}
          </div>
          {message && <p role="status" className="mt-3 text-sm text-rio-muted">{message}</p>}
        </>
      )}
    </section>
  );
}
