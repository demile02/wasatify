import { Mail, School, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';

export default async function StudentProfilePage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;

  return (
    <div>
      <PageHeader
        eyebrow="Profil"
        title="Pengaturan Profil"
        description="Informasi dasar akun siswa. Form edit akan dihubungkan ke Supabase pada fase berikutnya."
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.35fr_0.65fr]">
        <SectionCard className="text-center">
          <div className="flex justify-center">
            <UserAvatar name={profile.full_name} size="lg" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-ink">{profile.full_name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{profile.class_name}</p>
        </SectionCard>

        <SectionCard>
          <p className="font-bold text-ink">Informasi Akun</p>
          <div className="mt-5 grid gap-4">
            <ProfileRow icon={UserRound} label="Nama lengkap" value={profile.full_name} />
            <ProfileRow icon={Mail} label="Email" value={profile.email ?? '-'} />
            <ProfileRow icon={School} label="Kelas" value={profile.class_name ?? '-'} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white px-4 py-4">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}
