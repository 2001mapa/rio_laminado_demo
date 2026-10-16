import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { monitoringArea, safeBreadcrumbTimeline, safeErrorMessage, safeMonitoringRoute, sendDiscordAlert } from '../src/lib/discord-monitoring';

describe('alertas de Discord', () => {
  const originalErrorWebhook = process.env.DISCORD_ERROR_WEBHOOK_URL;
  const originalSecurityWebhook = process.env.DISCORD_SECURITY_WEBHOOK_URL;

  beforeEach(() => {
    process.env.DISCORD_ERROR_WEBHOOK_URL = 'https://discord.com/api/webhooks/1234567890/error-token';
    process.env.DISCORD_SECURITY_WEBHOOK_URL = 'https://discord.com/api/webhooks/1234567890/security-token';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    if (originalErrorWebhook === undefined) delete process.env.DISCORD_ERROR_WEBHOOK_URL;
    else process.env.DISCORD_ERROR_WEBHOOK_URL = originalErrorWebhook;
    if (originalSecurityWebhook === undefined) delete process.env.DISCORD_SECURITY_WEBHOOK_URL;
    else process.env.DISCORD_SECURITY_WEBHOOK_URL = originalSecurityWebhook;
    vi.unstubAllGlobals();
  });

  it('clasifica rutas internas de Next y oculta identificadores y parámetros', () => {
    expect(monitoringArea('/app/vendedor/nueva-venta/page')).toBe('vendedor');
    expect(safeMonitoringRoute('/admin/pedidos/WEB-123/imprimir?token=abc', 'admin'))
      .toBe('/admin/pedidos/[id]/imprimir');
    expect(safeMonitoringRoute('/cliente/privado/correo@example.com', 'cliente')).toBe('/cliente');
  });

  it('depura secretos y datos personales del resumen', () => {
    const result = safeErrorMessage('Error https://example.com/a?token=x foo@example.com password=12345 id 123456789');
    expect(result).not.toContain('example.com');
    expect(result).not.toContain('12345');
    expect(result).toContain('[correo]');
    expect(result).toContain('[credencial]');
  });

  it('muestra acciones previas permitidas sin valores de formularios ni IDs', () => {
    expect(safeBreadcrumbTimeline([
      { type: 'navigation', path: '/admin/pedidos/WEB-123?email=secret@example.com', secondsAgo: 10 },
      { type: 'click', path: '/admin/pedidos/WEB-123', action: 'buscar', secondsAgo: 4 },
      { type: 'click', path: '/admin/pedidos/WEB-123', action: 'cliente privado', secondsAgo: 2 },
    ], 'admin')).toBe('hace 10s · abrió /admin/pedidos/[id]\nhace 4s · pulsó «buscar» en /admin/pedidos/[id]');
  });

  it('separa alertas de seguridad y no permite menciones', async () => {
    await sendDiscordAlert('access_denied', 'login', { operation: 'testAccess', reason: 'invalid_role', route: '/login' });
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('security-token');
    const body = JSON.parse(String(options?.body));
    expect(body.allowed_mentions).toEqual({ parse: [] });
    expect(body.embeds[0].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Operación', value: 'testAccess' }),
    ]));
  });
});
