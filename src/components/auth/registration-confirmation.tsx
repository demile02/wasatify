'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput } from '@/components/auth/auth-fields';
import { Button } from '@/components/ui/button';
import { pendingRegistrationEmailKey } from '@/lib/auth/registration';
import { getEmailConfirmationRedirectUrl } from '@/lib/auth/redirect-urls';
import type { AppRole } from '@/lib/types';

type RegistrationConfirmationProps = {
  method: 'email' | 'google';
  role: Extract<AppRole, 'student' | 'teacher'>;
  confirmed: boolean;
  ready: boolean;
};

export function RegistrationConfirmation({ method, role, confirmed, ready }: RegistrationConfirmationProps) {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    try {
      setEmail(window.sessionStorage.getItem(pendingRegistrationEmailKey) ?? '');
    } catch {
      // The email field remains available for manual entry.
    }
  }, []);

  async function resendConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsResending(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: getEmailConfirmationRedirectUrl(window.location.origin) },
      });

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Email konfirmasi sudah dikirim ulang. Periksa inbox dan folder spam.' });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const message = rawMessage.includes('rate') || rawMessage.includes('too many')
        ? 'Terlalu banyak permintaan. Tunggu beberapa saat sebelum mencoba lagi.'
        : 'Email konfirmasi belum dapat dikirim. Periksa alamat email atau coba lagi beberapa saat.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsResending(false);
    }
  }

  if (method === 'google') {
    const roleLabel = role === 'teacher' ? 'guru' : 'siswa';

    return (
      <section aria-labelledby="confirmation-title">
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-primary">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-primary">Pendaftaran dengan Google</p>
        <h1 id="confirmation-title" className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
          Email sudah terverifikasi
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Google sudah mengonfirmasi alamat emailmu. Lanjutkan untuk melengkapi data {roleLabel}.
        </p>
        <Button asChild size="lg" className="mt-7 w-full">
          <Link href={`/register/${role}/complete`}>
            Lanjutkan pendaftaran <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    );
  }

  if (confirmed || ready) {
    return (
      <section aria-labelledby="confirmation-title">
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-primary">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-primary">Pendaftaran {role === 'teacher' ? 'guru' : 'siswa'}</p>
        <h1 id="confirmation-title" className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
          {confirmed ? 'Email berhasil dikonfirmasi' : 'Akun berhasil dibuat'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {confirmed
            ? 'Alamat emailmu sudah terverifikasi. Masuk untuk mulai menggunakan WASATIFY.'
            : 'Akunmu sudah siap digunakan. Masuk untuk mulai menggunakan WASATIFY.'}
        </p>
        <Button asChild size="lg" className="mt-7 w-full">
          <Link href="/login">Lanjut ke halaman masuk <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="confirmation-title">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-primary">
        <Mail className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-primary">Satu langkah lagi</p>
      <h1 id="confirmation-title" className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
        Periksa emailmu
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Kami mengirim tautan konfirmasi untuk pendaftaran {role === 'teacher' ? 'guru' : 'siswa'}. Buka tautan itu untuk mengaktifkan akun.
      </p>

      <form onSubmit={resendConfirmation} className="mt-7 space-y-4">
        {feedback && (
          <div role={feedback.type === 'error' ? 'alert' : 'status'} aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}>
            <AuthAlert type={feedback.type} message={feedback.message} />
          </div>
        )}
        <AuthInput
          label="Email pendaftaran"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Belum menerima email konfirmasi?{' '}
          <Button type="submit" variant="link" className="min-h-11 px-1 font-bold" disabled={isResending}>
            {isResending ? <><RefreshCw className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" /> Mengirim…</> : 'Kirim ulang di sini'}
          </Button>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah konfirmasi?{' '}
        <Link href="/login" className="font-bold text-primary hover:underline">Masuk di sini</Link>
      </p>
    </section>
  );
}
