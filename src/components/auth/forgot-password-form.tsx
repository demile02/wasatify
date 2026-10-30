'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { EmailInputWithSuggestions } from '@/components/auth/email-input-with-suggestions';
import { Button } from '@/components/ui/button';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email tidak valid.'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const RATE_LIMIT_FALLBACK_SECONDS = 10 * 60;

export function ForgotPasswordForm({ resetError = '' }: { resetError?: string }) {
  const [error, setError] = useState(resetError);
  const [success, setSuccess] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [recoveryAction, setRecoveryAction] = useState<'confirmation' | 'google-registration' | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  const emailRegister = register('email');
  const emailValue = useWatch({ control, name: 'email' }) ?? '';

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timeout = window.setTimeout(() => {
      setCooldownSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldownSeconds]);

  async function onSubmit(values: ForgotPasswordValues) {
    if (cooldownSeconds > 0) return;

    setError('');
    setSuccess('');
    setRecoveryAction(null);

    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });
      const result = await response.json() as { status?: string; retryAfterSeconds?: number };

      if (result.status === 'not_registered') {
        const message = 'Email belum terdaftar. Periksa ejaan alamat atau daftar akun terlebih dahulu.';
        setError(message);
        toast.error(message);
        return;
      }

      if (result.status === 'registration_incomplete') {
        const message = 'Pendaftaran Google belum selesai. Masuk kembali melalui Google dan lengkapi nama serta kode pendaftaran.';
        setError(message);
        setRecoveryAction('google-registration');
        toast.error(message);
        return;
      }

      if (result.status === 'email_unconfirmed') {
        const message = 'Email akun belum dikonfirmasi. Konfirmasi alamat email sebelum meminta reset kata sandi.';
        setError(message);
        setRecoveryAction('confirmation');
        toast.error(message);
        return;
      }

      if (response.status === 429 || result.status === 'rate_limited') {
        const retryAfterHeader = Number(response.headers.get('Retry-After'));
        const bodyRetryAfter = result.retryAfterSeconds;
        const retryAfterSeconds = typeof bodyRetryAfter === 'number'
          && Number.isInteger(bodyRetryAfter)
          && bodyRetryAfter > 0
          ? bodyRetryAfter
          : Number.isInteger(retryAfterHeader) && retryAfterHeader > 0
            ? retryAfterHeader
            : RATE_LIMIT_FALLBACK_SECONDS;
        setCooldownSeconds(retryAfterSeconds);
        throw new Error('rate_limited');
      }

      if (!response.ok || result.status !== 'sent') {
        throw new Error('password_reset_failed');
      }

      const message = 'Link reset password telah dikirim. Cek email Anda. Jika belum menerima email, periksa ejaan alamat dan folder Spam.';
      setSuccess(message);
      toast.success('Link reset password telah dikirim. Cek email Anda.');
    } catch (nextError) {
      const rawMessage = nextError instanceof Error ? nextError.message.toLowerCase() : '';
      const message = rawMessage.includes('rate') || rawMessage.includes('too many')
        ? 'Terlalu banyak permintaan reset password. Coba lagi nanti.'
        : 'Link reset password belum dapat dikirim. Periksa koneksi dan coba lagi setelah hitung mundur selesai.';
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Lupa password?</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Masukkan email akun Anda. Jika terdaftar, kami akan mengirim link untuk mengatur ulang password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && <AuthAlert type="error" message={error} />}
        {recoveryAction === 'confirmation' && (
          <p className="text-sm text-muted-foreground">
            Belum menerima email konfirmasi?{' '}
            <Link href="/register/confirmation" className="font-bold text-primary hover:underline">
              Kirim ulang di sini.
            </Link>
          </p>
        )}
        {recoveryAction === 'google-registration' && (
          <p className="text-sm text-muted-foreground">
            <Link href="/register" className="font-bold text-primary hover:underline">
              Kembali ke pendaftaran Google.
            </Link>
          </p>
        )}
        {success && <AuthAlert type="success" message={success} />}

        <EmailInputWithSuggestions
          label="Email"
          value={emailValue}
          onValueChange={(nextValue) => setValue('email', nextValue, { shouldDirty: true, shouldValidate: false })}
          name={emailRegister.name}
          inputRef={emailRegister.ref}
          onBlur={emailRegister.onBlur}
          placeholder="nama@email.com"
          autoComplete="email"
          error={errors.email?.message}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || cooldownSeconds > 0}>
          {isSubmitting
            ? 'Mengirim...'
            : cooldownSeconds > 0
              ? `Kirim ulang dalam ${cooldownSeconds} detik`
              : 'Kirim Link Reset'}
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
