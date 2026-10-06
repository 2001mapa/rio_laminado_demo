let lastReported = 0;

function reportBrowserError(type: 'error' | 'unhandledrejection') {
  if (process.env.NODE_ENV !== 'production' || !navigator.onLine) return;
  const now = Date.now();
  if (now - lastReported < 60_000) return;
  lastReported = now;
  void fetch('/api/monitoring/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
    keepalive: true,
  }).catch(() => {});
}

window.addEventListener('error', () => reportBrowserError('error'));
window.addEventListener('unhandledrejection', () => reportBrowserError('unhandledrejection'));
