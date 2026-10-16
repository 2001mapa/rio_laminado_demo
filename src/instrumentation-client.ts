const lastReported = new Map<string, number>();
type Breadcrumb = { type: 'navigation' | 'click'; path: string; action?: string; at: number };
const breadcrumbs: Breadcrumb[] = [];
const trackedActions = new Set([
  'buscar', 'agregar a la orden', 'finalizar venta', 'activar lector qr',
  'pausar cámara', 'ver pedido', 'imprimir etiquetas', 'guardar',
]);

function remember(event: Breadcrumb) {
  breadcrumbs.push(event);
  if (breadcrumbs.length > 6) breadcrumbs.shift();
}

try {
  remember({ type: 'navigation', path: window.location.pathname, at: Date.now() });
  document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest('button');
    if (!control) return;
    const action = control.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();
    if (action && trackedActions.has(action)) {
      remember({ type: 'click', action, path: window.location.pathname, at: Date.now() });
    }
  }, { capture: true, passive: true });
} catch {
  // Tracking context must never interfere with the application.
}

export function onRouterTransitionStart(url: string) {
  try {
    remember({ type: 'navigation', path: new URL(url, window.location.origin).pathname, at: Date.now() });
  } catch {
    // Ignore malformed navigation context.
  }
}

function reportBrowserError(type: 'error' | 'unhandledrejection', reason: unknown) {
  if (process.env.NODE_ENV !== 'production' || !navigator.onLine) return;
  const error = reason instanceof Error ? reason : null;
  const name = error?.name || 'UnknownError';
  const message = error?.message || (typeof reason === 'string' ? reason : 'Error sin mensaje');
  const key = `${type}:${name}:${message.slice(0, 80)}:${window.location.pathname}`;
  const now = Date.now();
  if (now - (lastReported.get(key) ?? 0) < 60_000) return;
  lastReported.set(key, now);
  if (lastReported.size > 50) {
    for (const [entry, at] of lastReported) {
      if (now - at > 60_000) lastReported.delete(entry);
    }
  }
  void fetch('/api/monitoring/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type, name: name.slice(0, 40), message: message.slice(0, 500), path: window.location.pathname,
      breadcrumbs: breadcrumbs.filter(item => now - item.at <= 90_000).map(item => ({
        type: item.type, path: item.path, action: item.action,
        secondsAgo: Math.max(0, Math.min(90, Math.round((now - item.at) / 1000))),
      })),
    }),
    keepalive: true,
  }).catch(() => {});
}

window.addEventListener('error', event => reportBrowserError('error', event.error || event.message));
window.addEventListener('unhandledrejection', event => reportBrowserError('unhandledrejection', event.reason));
