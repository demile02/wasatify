import { PageHeader } from '@/components/shared/page-header';
import { ProfileSettingsForm } from '@/components/shared/profile-settings-form';
import { InstallAppPrompt } from '@/components/pwa/install-app-prompt';
import type { Profile } from '@/lib/types';

export function DemoAccountSettings({
  profile,
  roleLabel,
  roleDescription,
}: {
  profile: Profile;
  roleLabel: 'Siswa' | 'Guru';
  roleDescription: string;
}) {
  return (
    <div>
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan"
        description={`Kelola foto profil dan informasi dasar akun ${roleLabel.toLowerCase()}.`}
      />
      <ProfileSettingsForm
        profile={profile}
        roleLabel={roleLabel}
        roleDescription={roleDescription}
        readOnly
      />
      <InstallAppPrompt compact className="mt-6" />
    </div>
  );
}
