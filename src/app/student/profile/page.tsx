import { PageHeader } from '@/components/shared/page-header';
import { InstallAppPrompt } from '@/components/pwa/install-app-prompt';
import { ProfileSettingsForm } from '@/components/shared/profile-settings-form';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';

export default async function StudentProfilePage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;

  return (
    <div>
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan"
        description="Kelola foto profil dan informasi dasar akun siswa."
      />

      <ProfileSettingsForm profile={profile} roleLabel="Siswa" roleDescription={profile.class_name ?? 'Siswa WASATIFY'} />
      <InstallAppPrompt compact className="mt-6" />
    </div>
  );
}
