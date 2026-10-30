import { redirect } from 'next/navigation';
import { LockKeyhole, UserRound } from 'lucide-react';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput } from '@/components/auth/auth-fields';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { loginAdminAction } from '@/lib/admin/auth-actions';
import { getCurrentProfile } from '@/lib/auth/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const profile = await getCurrentProfile();
  if (profile?.role === 'admin') redirect('/admin/invites');

  const { error } = await searchParams;
  const message = error === 'config' || !isSupabaseConfigured
      ? 'Koneksi Supabase belum dikonfigurasi di server.'
      : error === 'invalid'
        ? 'Nama pengguna atau kata sandi tidak cocok.'
        : null;
  const canLogin = isSupabaseConfigured;

  return (
    <AuthShell
      title="Masuk sebagai admin"
      description="Masuk untuk membuat dan membagikan kode pendaftaran guru."
      redirectGuard={false}
    >
      <div className="w-full">
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-3xl">Login Admin</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground lg:hidden">
            Masuk untuk membuat dan membagikan kode pendaftaran guru.
          </p>
        </div>

        <form action={loginAdminAction} className="space-y-5">
          {message && <AuthAlert type="error" message={message} />}
          <AuthInput
            label="Nama pengguna"
            name="username"
            placeholder="Masukkan nama pengguna"
            autoComplete="username"
            autoCapitalize="none"
            maxLength={80}
            leftIcon={<UserRound aria-hidden="true" className="h-4 w-4" />}
            required
            disabled={!canLogin}
          />
          <AuthInput
            label="Kata sandi"
            name="password"
            type="password"
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            maxLength={200}
            leftIcon={<LockKeyhole aria-hidden="true" className="h-4 w-4" />}
            required
            disabled={!canLogin}
          />
          <Button type="submit" size="lg" className="w-full" disabled={!canLogin}>
            Masuk
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
