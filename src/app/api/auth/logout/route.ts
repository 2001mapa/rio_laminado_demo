import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  // Prevent Next.js <Link> prefetching from accidentally destroying the session
  if (
    request.headers.get('purpose') === 'prefetch' || 
    request.headers.get('x-middleware-prefetch') ||
    request.headers.get('rsc') === '1' ||
    url.searchParams.has('_rsc')
  ) {
    return new Response(null, { status: 204 })
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/login', url.origin))
}
