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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options, path: '/' })
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Proteger las rutas que requieren inicio de sesión
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor') || request.nextUrl.pathname.startsWith('/cliente'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redireccionar si el usuario ya inició sesión y trata de entrar al login
  if (user && request.nextUrl.pathname === '/login') {
    // Buscar los metadatos del usuario para saber a dónde mandarlo
    const role = user.user_metadata?.role || 'admin';
    const url = request.nextUrl.clone()
    
    if (role === 'admin') url.pathname = '/admin'
    else if (role === 'vendedor') url.pathname = '/vendedor'
    else if (role === 'cliente') url.pathname = '/cliente'
    else url.pathname = '/'
    
    return NextResponse.redirect(url)
  }

  // Prevenir que el navegador guarde la página en caché (Evita el error del botón "Atrás" en móviles)
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor') || request.nextUrl.pathname.startsWith('/cliente')) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('Expires', '0');
  }

  return supabaseResponse
}
