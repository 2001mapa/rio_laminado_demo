'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const rawUser = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!rawUser || !password) {
      setError('Faltan credenciales');
      setLoading(false);
      return;
    }

    const email = rawUser.includes('@') ? rawUser : `${rawUser}@rio.local`;
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Usuario o contraseña incorrectos');
        setLoading(false);
        return;
      }

      // Safe Instrumentation Logging
      const cookieNames1 = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(c => c.startsWith('sb-'));
      console.log('[Login] T0 (Right after signIn):', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        expiresAt: data.session?.expires_at,
        sbCookies: cookieNames1
      });

      // Fetch session again to see if SDK retained it
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[Login] T1 (Re-fetching session):', {
        hasSession: !!sessionData.session
      });

      // Wait 1 second to rule out race conditions/flush issues
      await new Promise(r => setTimeout(r, 1000));
      
      const cookieNames2 = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(c => c.startsWith('sb-'));
      console.log('[Login] T2 (After 1s wait):', {
        sbCookies: cookieNames2
      });

      const role = data.user?.user_metadata?.role || 'admin';
      
      // Use window.location.assign for full navigation to avoid Next.js App Router soft-nav race conditions with cookies
      const targetPath = role === 'admin' ? '/admin' : role === 'vendedor' ? '/vendedor' : role === 'cliente' ? '/cliente' : '/';
      
      console.log('[Login] T3 (Navigating to):', targetPath);
      window.location.assign(targetPath);
      
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un error inesperado.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rio-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-rio-ink text-white rounded-2xl flex items-center justify-center text-4xl font-serif font-bold mx-auto shadow-xl mb-6">
            R
          </div>
          <h1 className="text-3xl font-serif font-bold text-rio-ink">Portal RIO</h1>
          <p className="text-rio-muted mt-2">Acceso a mayoristas y equipo</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-rio-border space-y-6">
          {error && (
            <div className="p-4 bg-rio-danger/10 text-rio-danger border border-rio-danger/20 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-rio-muted uppercase tracking-wider mb-2">
              Usuario o Identificación
            </label>
            <input 
              name="username"
              type="text" 
              required
              placeholder="Ej: 1012345678 o maria.oro"
              className="w-full px-4 py-3 bg-rio-surface border border-rio-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rio-gold text-rio-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rio-muted uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-rio-surface border border-rio-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rio-gold text-rio-ink"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-rio-ink text-white font-bold rounded-xl hover:bg-rio-ink/90 transition-colors shadow-sm flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-rio-muted mt-8">
          ¿No tienes acceso? Contacta a tu asesor comercial.
        </p>
      </div>
    </div>
  );
}
