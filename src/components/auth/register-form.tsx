'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput, AuthTextarea } from '@/components/auth/auth-fields';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { Button } from '@/components/ui/button';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/client';
import type { AppRole } from '@/lib/types';

type RegisterFormProps = {
  role: Extract<AppRole, 'student' | 'teacher'>;
};

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
    email: z.string().trim().email('Email tidak valid.'),
    className: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Konfirmasi password belum sama.',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm({ role }: RegisterFormProps) {
  const router = useRouter();
  const isTeacher = role === 'teacher';
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      className: '',
      subject: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const fullName = values.fullName.trim();
      const email = values.email.trim();
      const className = values.className?.trim() || null;
      const subject = values.subject?.trim() || null;
      const metadata = {
        role,
        full_name: fullName,
        name: fullName,
        class_name: isTeacher ? null : className,
        subject: isTeacher ? subject : null,
      };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: metadata,
        },
      });

      if (signUpError) throw signUpError;

      if (data.session?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: data.session.user.id,
            role,
            full_name: fullName,
            email,
            class_name: isTeacher ? null : className,
            subject: isTeacher ? subject : null,
          },
          { onConflict: 'id' },
        );

        if (profileError) throw profileError;

        toast.success('Akun berhasil dibuat.');
        router.push(getRoleDashboardPath(role));
        router.refresh();
        return;
      }

      const message = 'Akun berhasil dibuat. Jika konfirmasi email aktif, cek inbox Anda sebelum login.';
      setSuccess(message);
      toast.success(message);
    } catch (nextError) {
      const message = getRegisterErrorMessage(nextError);
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gold">{isTeacher ? 'Daftar sebagai guru' : 'Daftar sebagai siswa'}</p>
      <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
        {isTeacher ? 'Buat Akun Guru' : 'Buat Akun Siswa'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Lengkapi data dasar untuk mulai menggunakan WASATIFY.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && <AuthAlert type="error" message={error} />}
        {success && <AuthAlert type="success" message={success} />}

        <AuthInput
          label="Nama lengkap"
          placeholder="Masukkan nama lengkap"
          autoComplete="name"
          leftIcon={<UserRound className="h-4 w-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {isTeacher ? (
          <AuthTextarea
            label="Mata pelajaran / tugas"
            placeholder="Contoh: Akhlak, PAI, wali kelas, pembina rohis"
            error={errors.subject?.message}
            {...register('subject')}
          />
        ) : (
          <AuthInput
            label="Kelas"
            placeholder="Contoh: VIII A"
            hint="Opsional. Bisa dilengkapi nanti jika kelas belum tersedia."
            error={errors.className?.message}
            {...register('className')}
          />
        )}

        <div className="relative">
          <AuthInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Buat password"
            autoComplete="new-password"
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

        <AuthInput
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Ulangi password"
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Membuat akun...' : isTeacher ? 'Daftar sebagai Guru' : 'Daftar sebagai Siswa'}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau daftar dengan
        <span className="h-px flex-1 bg-border" />
      </div>

      <SocialAuthButtons />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('already registered')) {
      return 'Email ini sudah terdaftar. Silakan login.';
    }
    return error.message;
  }

  return 'Terjadi kesalahan saat membuat akun.';
}
