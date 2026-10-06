import { createClient } from '@/utils/supabase/server';
import { monitoringArea, sendDiscordAlert } from '@/lib/discord-monitoring';

export async function POST(request: Request) {
  if (request.headers.get('content-length') && Number(request.headers.get('content-length')) > 256) {
    return new Response(null, { status: 204 });
  }
  try {
    const { type } = await request.json();
    if (type !== 'error' && type !== 'unhandledrejection') return new Response(null, { status: 204 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(null, { status: 204 });
    // No se aceptan mensajes, URLs ni trazas enviados por el navegador.
    const role = user.app_metadata?.role;
    const area = role === 'admin' || role === 'vendedor' || role === 'cliente'
      ? monitoringArea(`/${role}`)
      : 'otra';
    await sendDiscordAlert('browser_error', area, type);
  } catch {
    // El monitoreo es de mejor esfuerzo y nunca devuelve detalles internos.
  }
  return new Response(null, { status: 204 });
}
