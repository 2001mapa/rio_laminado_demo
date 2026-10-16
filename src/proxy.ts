import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'
import { isClientMaintenanceActive } from '@/lib/client-maintenance'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if ((request.method === 'GET' || request.method === 'HEAD') && (path === '/cliente' || path.startsWith('/cliente/'))) {
    try {
      if (await isClientMaintenanceActive()) {
        const response = NextResponse.redirect(new URL('/mantenimiento', request.url))
        response.headers.set('Cache-Control', 'no-store')
        return response
      }
    } catch (error) {
      // A settings lookup failure must not trap users in maintenance mode.
      console.error('[Maintenance] Could not read client maintenance state', error)
    }
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
