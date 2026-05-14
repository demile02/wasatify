import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterStudentPage() {
  return (
    <AuthShell
      title="Mulai Perjalanan Belajar"
      description="Buat akun siswa untuk mengakses modul, mengerjakan kuis, menulis refleksi, dan memantau pencapaian."
    >
      <RegisterForm role="student" />
    </AuthShell>
  );
}
