import { AuthShell } from '@/components/auth/auth-shell';
import { RegistrationConfirmation } from '@/components/auth/registration-confirmation';
import type { AppRole } from '@/lib/types';

type RegistrationConfirmationPageProps = {
  searchParams: Promise<{
    method?: string;
    role?: string;
    confirmed?: string;
    ready?: string;
  }>;
};

export default async function RegistrationConfirmationPage({ searchParams }: RegistrationConfirmationPageProps) {
  const params = await searchParams;
  const method = params.method === 'google' ? 'google' : 'email';
  const role: Extract<AppRole, 'student' | 'teacher'> = params.role === 'teacher' ? 'teacher' : 'student';
  const confirmed = params.confirmed === '1';
  const ready = params.ready === '1';

  return (
    <AuthShell
      title="Konfirmasi pendaftaran"
      description="Selesaikan verifikasi akun untuk mulai menggunakan WASATIFY."
    >
      <RegistrationConfirmation method={method} role={role} confirmed={confirmed} ready={ready} />
    </AuthShell>
  );
}
