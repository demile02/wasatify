'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput } from '@/components/auth/auth-fields';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email tidak valid.'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/login`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo,
      });

      if (resetError) throw resetError;

      const message = 'Link reset password sudah dikirim jika email terdaftar.';
      setSuccess(message);
      toast.success(message);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Gagal mengirim link reset password.';
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gold">Bantuan akun</p>
      <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Lupa password?</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Masukkan email akun Anda. Kami akan mengirim link untuk mengatur ulang password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && <AuthAlert type="error" message={error} />}
        {success && <AuthAlert type="success" message={success} />}

        <AuthInput
          label="Email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Ingat password?{' '}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Kembali login
        </Link>
      </p>
    </div>
  );
}
