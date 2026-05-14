'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput } from '@/components/auth/auth-fields';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { Button } from '@/components/ui/button';
import { getRoleDashboardPath, isAppRole } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/client';
import type { AppRole } from '@/lib/types';
import { cn } from '@/lib/utils';

type LoginFormProps = {
  nextPath?: string;
};

const loginSchema = z.object({
  email: z.string().trim().email('Email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError('');

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
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
      router.push(nextPath && nextPath.startsWith('/') ? nextPath : getRoleDashboardPath(profile.role));
      router.refresh();
    } catch (nextError) {
      const message = getAuthErrorMessage(nextError);
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gold">Masuk ke akun Anda</p>
      <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Selamat datang kembali</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Pilih peran, masuk dengan email, lalu lanjutkan perjalanan belajar atau mengajar di WASATIFY.
      </p>

      <div className="mt-8 grid grid-cols-2 rounded-2xl bg-mint p-1">
        {[
          ['student', 'Login Siswa'],
          ['teacher', 'Login Guru'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value as AppRole)}
            className={cn(
              'rounded-xl px-4 py-3 text-sm font-bold transition',
              role === value ? 'bg-primary text-white shadow-card' : 'text-primary hover:bg-white/60',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && <AuthAlert type="error" message={error} />}

        <AuthInput
          label="Email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <AuthInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan password"
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
            className="pr-12"
            error={errors.password?.message}
            {...register('password')}
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
              {...register('remember')}
            />
            Ingat saya
          </label>
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            Lupa password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Memeriksa akun...' : 'Masuk'}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau masuk dengan
        <span className="h-px flex-1 bg-border" />
      </div>

      <SocialAuthButtons />

      <p className="mt-8 text-center text-sm text-muted-foreground">
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
