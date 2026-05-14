import { AuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Pulihkan Akses Akun"
      description="Masukkan email akun WASATIFY. Jika terdaftar, Anda akan menerima link untuk mengatur ulang password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
