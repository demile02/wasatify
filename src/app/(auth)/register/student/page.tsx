import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { getPublicClassesForRegistration } from '@/lib/auth/classes';

export default async function RegisterStudentPage() {
  const classes = await getPublicClassesForRegistration();

  return (
    <AuthShell
      title="Mulai Perjalanan Belajar"
      description="Buat akun siswa untuk mengakses modul, mengerjakan kuis, menulis refleksi, dan memantau pencapaian."
    >
      <RegisterForm role="student" initialClasses={classes} />
    </AuthShell>
  );
}
