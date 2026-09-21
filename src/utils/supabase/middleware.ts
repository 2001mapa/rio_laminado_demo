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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const cookieNamesBefore = request.cookies.getAll().filter(c => c.name.startsWith('sb-')).map(c => c.name);
  console.log(`[Middleware] Before getUser | Path: ${request.nextUrl.pathname} | Cookies: ${cookieNamesBefore.join(', ')}`);

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error(`[Middleware] Supabase Auth Error: ${error.name} - ${error.message} - ${error.status}`);
  }
  
  const cookieNamesAfter = supabaseResponse.cookies.getAll().filter(c => c.name.startsWith('sb-')).map(c => c.name);
  console.log(`[Middleware] After getUser | User: ${!!user} | Response Cookies: ${cookieNamesAfter.join(', ')}`);

  return supabaseResponse
}
