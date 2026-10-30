'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput } from '@/components/auth/auth-fields';
import { EmailInputWithSuggestions } from '@/components/auth/email-input-with-suggestions';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { Button } from '@/components/ui/button';
import { getRoleDashboardPath, isAppRole } from '@/lib/auth/roles';
import type { AppRole } from '@/lib/types';
import { cn } from '@/lib/utils';

type LoginFormProps = {
  nextPath?: string;
  confirmed?: boolean;
  oauthError?: string;
};

export function LoginForm({ nextPath, confirmed = false, oauthError }: LoginFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<Extract<AppRole, 'student' | 'teacher'>>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (oauthError === 'google') {
      setError('Login Google tidak berhasil. Untuk akun baru, gunakan formulir pendaftaran terlebih dahulu.');
    } else if (oauthError === 'role') {
      setError('Peran akun tidak cocok dengan pilihan saat masuk. Pilih tab jenis akun yang sesuai lalu coba lagi.');
    } else if (oauthError === 'profile') {
      setError('Profil Wasatify belum siap untuk login Google. Coba masuk dengan email dan password atau hubungi admin.');
    }
  }, [oauthError]);

  useEffect(() => {
    if (confirmed) {
      toast.success('Email berhasil dikonfirmasi. Silakan login.');
    }
  }, [confirmed]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim();
    const nextEmailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ? '' : 'Email tidak valid.';
    const nextPasswordError = password ? '' : 'Password wajib diisi.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) throw signInError;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error('Sesi login tidak ditemukan.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.role || !isAppRole(profile.role)) {
        throw new Error('Profil akun belum lengkap. Hubungi admin atau daftar ulang.');
      }

      if (profile.role !== 'admin' && profile.role !== role) {
        throw new Error(`Akun ini terdaftar sebagai ${profile.role === 'teacher' ? 'guru' : 'siswa'}. Pilih tab login yang sesuai.`);
      }

      toast.success('Login berhasil.');
      router.replace(nextPath && nextPath.startsWith('/') ? nextPath : getRoleDashboardPath(profile.role));
      router.refresh();
    } catch (nextError) {
      const message = getAuthErrorMessage(nextError);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl lg:hidden">Selamat datang kembali</h1>

      <div role="group" aria-label="Pilih jenis akun" className="mt-6 grid grid-cols-2 rounded-2xl bg-mint p-1 lg:mt-0">
        {[
          ['student', 'Login Siswa'],
          ['teacher', 'Login Guru'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={role === value}
            onClick={() => {
              setRole(value as Extract<AppRole, 'student' | 'teacher'>);
              setError('');
            }}
            className={cn(
              'rounded-xl px-4 py-3 text-sm font-bold transition',
              role === value ? 'bg-primary text-white shadow-card' : 'text-primary hover:bg-white/60',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form method="post" onSubmit={onSubmit} noValidate className="mt-8 space-y-5 lg:mt-8 lg:space-y-5">
        {confirmed && <AuthAlert type="success" message="Email berhasil dikonfirmasi. Silakan login." />}
        {error && <AuthAlert type="error" message={error} />}

        <EmailInputWithSuggestions
          label="Email"
          value={email}
          onValueChange={(nextValue) => { setEmail(nextValue); if (emailError) setEmailError(''); }}
          name="email"
          placeholder="nama@email.com"
          autoComplete="email"
          error={emailError}
        />

        <div className="relative">
          <AuthInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan password"
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
            className="pr-12"
            error={passwordError}
            name="password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); if (passwordError) setPasswordError(''); }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute bottom-3 right-4 text-muted-foreground transition hover:text-primary"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 font-medium text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Ingat saya
          </label>
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            Lupa password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!isHydrated || isSubmitting}>
          {isSubmitting ? 'Memeriksa akun...' : 'Masuk'}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs font-semibold text-muted-foreground lg:my-7">
        <span className="h-px flex-1 bg-border" />
        atau masuk dengan
        <span className="h-px flex-1 bg-border" />
      </div>

      <SocialAuthButtons
        nextPath={nextPath}
        onError={(message) => setError(message)}
      />

      <p className="mt-8 text-center text-sm text-muted-foreground lg:mt-8">
        Belum punya akun?{' '}
        <Link href="/register" className="font-bold text-primary hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('Invalid login credentials')) {
      return 'Email atau password tidak sesuai.';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Email belum dikonfirmasi. Silakan cek inbox email Anda.';
    }
    return error.message;
  }

  return 'Terjadi kesalahan saat login.';
}
