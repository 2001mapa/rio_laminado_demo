import 'server-only';

type AlertKind = 'server_error' | 'browser_error' | 'access_denied';
type Area = 'admin' | 'vendedor' | 'cliente' | 'login' | 'otra';

const lastSent = new Map<string, number>();

export function monitoringArea(path: string): Area {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/vendedor')) return 'vendedor';
  if (path.startsWith('/cliente')) return 'cliente';
  if (path.startsWith('/login')) return 'login';
  return 'otra';
}

export async function sendDiscordAlert(kind: AlertKind, area: Area, detail?: string) {
  const rawUrl = process.env.DISCORD_ERROR_WEBHOOK_URL;
  if (!rawUrl) return;

  let url: URL;
  try {
    url = new URL(rawUrl);
    if (url.protocol !== 'https:' || !['discord.com', 'discordapp.com'].includes(url.hostname) ||
      !/^\/api\/webhooks\/\d+\/[\w-]+\/?$/.test(url.pathname)) return;
  } catch {
    return;
  }

  // Reduce duplicados dentro de una instancia. No sustituye un rate limit distribuido.
  const key = `${kind}:${area}:${detail ?? ''}`;
  const now = Date.now();
  if (now - (lastSent.get(key) ?? 0) < 60_000) return;
  lastSent.set(key, now);
  if (lastSent.size > 200) {
    for (const [entry, timestamp] of lastSent) {
      if (now - timestamp > 60_000) lastSent.delete(entry);
    }
  }

  const labels: Record<AlertKind, string> = {
    server_error: 'Error del servidor',
    browser_error: 'Error del navegador',
    access_denied: 'Acceso rechazado tras iniciar sesión',
  };
  const safeDetail = detail && /^[a-zA-Z0-9_-]{1,40}$/.test(detail) ? ` · ${detail}` : '';
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 RIO · ${labels[kind]} · ${area}${safeDetail} · ${new Date(now).toISOString()}`,
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
  } catch {
    // Un fallo del monitoreo nunca debe interrumpir la venta o el login.
  }
}
