import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const sbCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    return NextResponse.json({
      hasSupabaseCookies: sbCookies.length > 0,
      cookieNames: sbCookies.map(c => c.name),
      hasUser: !!user,
      errorCode: error ? error.status : null,
      errorMessage: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      hasSupabaseCookies: false,
      hasUser: false,
      errorCode: 500,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
