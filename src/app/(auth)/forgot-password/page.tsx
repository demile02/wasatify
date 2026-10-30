import { AuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { redirectAuthenticatedUser } from '@/lib/auth/redirects';

type ForgotPasswordPageProps = {
  searchParams: Promise<{ reset_error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  const resetError = params.reset_error === 'expired'
    ? 'Link reset tidak berlaku atau sudah kedaluwarsa. Minta link baru di bawah.'
    : params.reset_error === 'send'
      ? 'Link reset belum dapat diproses. Minta link baru untuk mencoba lagi.'
      : '';

  return (
    <AuthShell
      title="Pulihkan Akses Akun"
      description="Masukkan email akun WASATIFY. Jika terdaftar, Anda akan menerima link untuk mengatur ulang password."
    >
      <ForgotPasswordForm resetError={resetError} />
    </AuthShell>
  );
}
