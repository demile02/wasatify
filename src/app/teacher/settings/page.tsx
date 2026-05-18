import { PageHeader } from '@/components/shared/page-header';
import { ProfileSettingsForm } from '@/components/shared/profile-settings-form';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';

export default async function TeacherSettingsPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;

  return (
    <div>
      <PageHeader
      eyebrow="Pengaturan"
        title="Pengaturan"
        description="Kelola foto profil dan informasi dasar akun guru."
      />

      <ProfileSettingsForm
        profile={profile}
        roleLabel={profile.role === 'admin' ? 'Admin' : 'Guru'}
        roleDescription={profile.subject ?? profile.school_name ?? 'Guru WASATIFY'}
      />
    </div>
  );
}
