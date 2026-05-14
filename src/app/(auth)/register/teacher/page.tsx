import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterTeacherPage() {
  return (
    <AuthShell
      title="Ruang Mengajar Lebih Terarah"
      description="Buat akun guru untuk mengelola modul, kelas, kuis, refleksi siswa, dan laporan pembelajaran."
    >
      <RegisterForm role="teacher" />
    </AuthShell>
  );
}
