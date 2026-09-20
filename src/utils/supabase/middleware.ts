import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // DIAGNOSTIC PREVENT WIPE: Si Supabase intenta borrar la cookie enviando un valor vacío, lo bloqueamos
            // Esto nos permitirá ver si la cookie sobrevive y qué error lanza exactamente getUser() en el Server Action
            if (!value) {
              console.log(`[Proxy] Bloqueando intento de borrar cookie: ${name}`);
              return;
            }
            supabaseResponse.cookies.set({ name, value, ...options, path: '/' })
          })
        },
      },
    }
  )

  const cookieNames = request.cookies.getAll().map(c => c.name);
  console.log(`[Proxy] Route: ${request.nextUrl.pathname} | Cookies: ${cookieNames.join(', ')}`);

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error(`[Proxy] Supabase Auth Error: ${error.name} - ${error.message} - ${error.status}`);
  } else {
    console.log(`[Proxy] User found: ${!!user} | Role: ${user?.user_metadata?.role}`);
  }

  // Removed edge middleware redirects because of Edge timeout unreliability.
  // Security and routing is handled via Client/Server Components.

  // Prevenir que el navegador guarde la página en caché (Evita el error del botón "Atrás" en móviles)
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor') || request.nextUrl.pathname.startsWith('/cliente')) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('Expires', '0');
  }

  return supabaseResponse
}
