import { AuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { redirectAuthenticatedUser } from '@/lib/auth/redirects';

export default async function ForgotPasswordPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthShell
      title="Pulihkan Akses Akun"
      description="Masukkan email akun WASATIFY. Jika terdaftar, Anda akan menerima link untuk mengatur ulang password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
