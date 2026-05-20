import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { redirectAuthenticatedUser } from '@/lib/auth/redirects';

export default async function RegisterStudentPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthShell
      title="Mulai Perjalanan Belajar"
      description="Buat akun siswa untuk mengakses modul, mengerjakan kuis, menulis refleksi, dan memantau pencapaian."
    >
      <RegisterForm role="student" />
    </AuthShell>
  );
}
