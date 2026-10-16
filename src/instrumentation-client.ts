const lastReported = new Map<string, number>();

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
    body: JSON.stringify({ type, name: name.slice(0, 40), message: message.slice(0, 500), path: window.location.pathname }),
    keepalive: true,
  }).catch(() => {});
}

window.addEventListener('error', event => reportBrowserError('error', event.error || event.message));
window.addEventListener('unhandledrejection', event => reportBrowserError('unhandledrejection', event.reason));
