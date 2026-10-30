'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput } from '@/components/auth/auth-fields';
import { Button } from '@/components/ui/button';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Konfirmasi password belum sama.',
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
      if (updateError) throw updateError;

      setIsComplete(true);
      toast.success('Password berhasil diperbarui.');
    } catch (nextError) {
      const rawMessage = nextError instanceof Error ? nextError.message.toLowerCase() : '';
      const message = rawMessage.includes('session') || rawMessage.includes('token')
        ? 'Sesi reset tidak berlaku atau sudah kedaluwarsa. Minta link reset baru.'
        : 'Password belum dapat diperbarui. Periksa koneksi lalu coba lagi.';
      setError(message);
      toast.error(message);
    }
  }

  if (isComplete) {
    return (
      <section aria-labelledby="reset-success-title">
        <h1 id="reset-success-title" className="mb-4 text-3xl font-extrabold text-ink sm:text-4xl">
          Password diperbarui
        </h1>
        <AuthAlert type="success" message="Password berhasil diperbarui. Silakan masuk menggunakan password baru." />
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/login">Lanjut ke halaman masuk</Link>
        </Button>
      </section>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Buat password baru</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Gunakan minimal 6 karakter, lalu masukkan kembali untuk memastikan tidak ada salah ketik.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && <AuthAlert type="error" message={error} />}
        <div className="relative">
          <AuthInput
            label="Password baru"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan password baru"
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            className="pr-12"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute bottom-3 right-4 grid h-11 w-11 place-items-center text-muted-foreground transition hover:text-primary"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <AuthInput
          label="Konfirmasi password baru"
          type={showPassword ? 'text' : 'password'}
          placeholder="Masukkan ulang password baru"
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan password…' : 'Simpan password baru'}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Link bermasalah?{' '}
        <Link href="/forgot-password" className="font-bold text-primary hover:underline">
          Minta link reset baru
        </Link>
      </p>
    </div>
  );
}
