import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { getCurrentUser } from '@/lib/auth/server';

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/forgot-password?reset_error=expired');

  return (
    <AuthShell
      title="Atur ulang password"
      description="Buat password baru untuk mengamankan akun WASATIFY Anda."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
