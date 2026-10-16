import 'server-only';

type AlertKind = 'server_error' | 'browser_error' | 'action_error' | 'access_denied';
export type MonitoringArea = 'admin' | 'vendedor' | 'cliente' | 'login' | 'otra';

export type AlertContext = {
  operation?: string;
  route?: string;
  method?: string;
  error?: unknown;
  errorName?: string;
  message?: string;
  digest?: string;
  browser?: string;
  reason?: string;
};

const cooldownMs = 60_000;
const lastSent = new Map<string, { at: number; suppressed: number }>();

export function monitoringArea(path: string): MonitoringArea {
  const match = path.match(/(?:^|\/)(admin|vendedor|cliente|login)(?:\/|$)/);
  return (match?.[1] as MonitoringArea | undefined) ?? 'otra';
}

export function safeMonitoringRoute(path: string, area: MonitoringArea): string {
  // Never forward query strings, hashes, order numbers, customer IDs or arbitrary browser paths.
  const clean = path.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
  const allowed = [
    /^\/(?:admin|vendedor|cliente|login)\/?$/,
    /^\/admin\/(?:pedidos|inventario|clientes|vendedores|administradores|historial)(?:\/imprimir)?$/,
    /^\/admin\/pedidos\/[^/]+\/(?:imprimir|verificar)$/,
    /^\/admin\/(?:pedidos|clientes|vendedores|administradores)\/[^/]+$/,
    /^\/vendedor\/(?:nueva-venta|perfil)$/,
    /^\/vendedor\/pedido\/[^/]+$/,
    /^\/cliente\/(?:carrito|perfil)$/,
    /^\/cliente\/pedido\/[^/]+$/,
  ];
  if (!allowed.some(pattern => pattern.test(clean))) return `/${area}`;
  return clean.replace(/\/(pedido|pedidos|clientes|vendedores|administradores)\/[^/]+(?=\/|$)/g, (_match, group: string) => `/${group}/[id]`);
}

function safeLabel(value: unknown, max = 70): string {
  return typeof value === 'string' && /^[a-zA-Z0-9_./\[\] -]+$/.test(value)
    ? value.slice(0, max)
    : '';
}

export function safeErrorMessage(value: unknown): string {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[correo]')
    .replace(/\b(?:Bearer\s+)?eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]')
    .replace(/\b(?:password|passwd|secret|token|api[_-]?key|authorization)\s*[:=]\s*[^\s,;]+/gi, '[credencial]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '[id]')
    .replace(/\b\d{7,}\b/g, '[número]')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
  return cleaned.slice(0, 220);
}

function webhookUrl(kind: AlertKind): URL | null {
  const raw = kind === 'access_denied'
    ? process.env.DISCORD_SECURITY_WEBHOOK_URL || process.env.DISCORD_ERROR_WEBHOOK_URL
    : process.env.DISCORD_ERROR_WEBHOOK_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && ['discord.com', 'discordapp.com'].includes(url.hostname)
      && /^\/api\/webhooks\/\d+\/[\w-]+\/?$/.test(url.pathname)
      && !url.search && !url.hash ? url : null;
  } catch {
    return null;
  }
}

export async function sendDiscordAlert(kind: AlertKind, area: MonitoringArea, context: AlertContext = {}) {
  const url = webhookUrl(kind);
  if (!url) return;

  const error = context.error instanceof Error ? context.error : null;
  const errorName = safeLabel(context.errorName || error?.name, 40);
  const operation = safeLabel(context.operation, 50);
  const route = safeLabel(context.route, 80);
  const reason = safeLabel(context.reason, 40);
  const key = [kind, area, operation, route, errorName, reason].join(':');
  const now = Date.now();
  const previous = lastSent.get(key);
  if (previous && now - previous.at < cooldownMs) {
    previous.suppressed += 1;
    return;
  }
  const suppressed = previous?.suppressed ?? 0;
  lastSent.set(key, { at: now, suppressed: 0 });
  if (lastSent.size > 200) {
    for (const [entry, state] of lastSent) {
      if (now - state.at > 2 * cooldownMs) lastSent.delete(entry);
    }
  }

  const incidentId = crypto.randomUUID().slice(0, 8);
  const labels: Record<AlertKind, string> = {
    server_error: 'Error del servidor',
    browser_error: 'Error del navegador',
    action_error: 'Operación fallida',
    access_denied: 'Acceso rechazado',
  };
  const fields = [
    { name: 'Área', value: area, inline: true },
    { name: 'Operación', value: operation || 'no identificada', inline: true },
    { name: 'Ruta', value: route || 'no disponible', inline: false },
    { name: 'Tipo', value: errorName || reason || 'no disponible', inline: true },
  ];
  const method = safeLabel(context.method, 10);
  const digest = safeLabel(context.digest, 64);
  const browser = safeLabel(context.browser, 30);
  const message = safeErrorMessage(context.message ?? error?.message);
  if (method) fields.push({ name: 'Método', value: method, inline: true });
  if (browser) fields.push({ name: 'Navegador', value: browser, inline: true });
  if (digest) fields.push({ name: 'Digest', value: digest, inline: true });
  if (message) fields.push({ name: 'Resumen depurado', value: message, inline: false });
  if (suppressed) fields.push({ name: 'Repeticiones omitidas', value: String(suppressed), inline: true });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `RIO | ${labels[kind]}`,
          color: kind === 'access_denied' ? 0xe5a000 : 0xd93838,
          fields,
          footer: { text: `Incidente ${incidentId} · detalle depurado` },
          timestamp: new Date(now).toISOString(),
        }],
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    if (!response.ok) console.warn(`[RIO monitor] Discord rechazó una alerta (${response.status}).`);
  } catch {
    // Monitoring must never interrupt sales, login or rendering.
  }
}
