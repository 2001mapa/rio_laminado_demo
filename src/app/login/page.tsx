'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveLoginDestination } from '@/app/actions/auth';
import styles from './page.module.css';
import { clearOfflineSellerAccess } from '@/lib/offlineQueue';

const brandLetters = Array.from('LAMINADO');

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

      // A new authenticated session must never inherit another seller's offline access.
      await clearOfflineSellerAccess().catch(() => {});

      // Safe Instrumentation Logging
      const cookieNames1 = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(c => c.startsWith('sb-'));
      

      // Fetch session again to see if SDK retained it
      const { data: sessionData } = await supabase.auth.getSession();
      

      // Wait 1 second to rule out race conditions/flush issues
      await new Promise(r => setTimeout(r, 1000));
      
      const cookieNames2 = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(c => c.startsWith('sb-'));
      
      
      // Check auth status securely on server
      const destination = await resolveLoginDestination();
      if (!destination.success) {
        // Sign out client-side since they are rejected
        await supabase.auth.signOut();
        setError(destination.message || 'No autorizado');
        setLoading(false);
        return;
      }
      
      setTimeout(() => {
        window.location.assign(destination.targetPath as string);
      }, 300);

      
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un error inesperado.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rio-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-9">
          <img
            src="/icon.svg"
            alt="RIO"
            width={96}
            height={96}
            className={`w-24 h-24 rounded-2xl mx-auto shadow-xl mb-6 ${styles.brandMark}`}
          />
          <h1 className="text-[26px] font-semibold tracking-[0.2em] text-rio-ink" aria-label="Laminado">
            {brandLetters.map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                aria-hidden="true"
                className={styles.brandLetter}
                style={{ animationDelay: `${140 + index * 65}ms` }}
              >
                {letter}
              </span>
            ))}
          </h1>
          <div className={`w-12 h-px bg-rio-gold mx-auto mt-3 ${styles.brandAccent}`} aria-hidden="true" />
          <p className={`text-rio-muted mt-3 ${styles.brandSubtitle}`}>Acceso para clientes y equipo</p>
        </div>

        <form onSubmit={handleSubmit} className={`bg-white p-8 rounded-3xl shadow-sm border border-rio-border space-y-6 ${styles.loginForm}`}>
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
        <nav aria-label="Información legal" className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-rio-muted">
          <Link href="/terminos" className="underline hover:text-rio-ink">Términos y condiciones</Link>
          <Link href="/tratamiento-de-datos" className="underline hover:text-rio-ink">Tratamiento de datos</Link>
        </nav>
      </div>
    </div>
  );
}
