import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleStudentRegistrationForm } from '@/components/auth/google-student-registration-form';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/server';

export default async function CompleteStudentRegistrationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/register/student');

  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?oauth_error=profile');
  if (profile.role !== 'student') redirect(getRoleDashboardPath(profile.role));
  if (profile.class_id) redirect(getRoleDashboardPath(profile.role));

  const initialFullName =
    profile.full_name ||
    (typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '') ||
    (typeof user.user_metadata.name === 'string' ? user.user_metadata.name : '');

  return (
    <AuthShell
      title="Satu langkah lagi"
      description="Lengkapi data siswa untuk mulai belajar bersama kelasmu."
    >
      <GoogleStudentRegistrationForm
        email={user.email ?? profile.email ?? ''}
        initialFullName={initialFullName}
      />
    </AuthShell>
  );
}
