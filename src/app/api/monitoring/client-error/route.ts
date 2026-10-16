import { createClient } from '@/utils/supabase/server';
import { safeMonitoringRoute, sendDiscordAlert, type MonitoringArea } from '@/lib/discord-monitoring';

function browserFamily(userAgent: string): string {
  if (/iPhone|iPad/i.test(userAgent)) return 'iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh/i.test(userAgent)) return 'macOS';
  return 'Otro';
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 2048) {
    return new Response(null, { status: 204 });
  }
  try {
    const body = await request.text();
    if (body.length > 2048) return new Response(null, { status: 204 });
    const { type, name, message, path, breadcrumbs } = JSON.parse(body);
    if (type !== 'error' && type !== 'unhandledrejection') return new Response(null, { status: 204 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(null, { status: 204 });
    const role = user.app_metadata?.role;
    const area: MonitoringArea = role === 'admin' || role === 'vendedor' || role === 'cliente' ? role : 'otra';
    await sendDiscordAlert('browser_error', area, {
      operation: type,
      route: safeMonitoringRoute(typeof path === 'string' ? path : '', area),
      errorName: typeof name === 'string' ? name : undefined,
      message: typeof message === 'string' ? message : undefined,
      browser: browserFamily(request.headers.get('user-agent') || ''),
      breadcrumbs,
    });
  } catch {
    // The monitoring endpoint is best-effort and never returns internal details.
  }
  return new Response(null, { status: 204 });
}
