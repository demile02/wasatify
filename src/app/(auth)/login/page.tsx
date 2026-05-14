import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Selamat Datang di WASATIFY"
      description="Masuk untuk melanjutkan pembelajaran Islam Wasathiyah, mengerjakan kuis, menulis refleksi, atau memantau kelas."
    >
      <LoginForm nextPath={params.next} />
    </AuthShell>
  );
}
