import { Lightbulb } from 'lucide-react';
import { ReflectionForm } from '@/components/student/reflection-form';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getReflectionModuleOptions } from '@/lib/student/reflection';

export default async function StudentReflectionPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const modules = await getReflectionModuleOptions(profile.id);

  return (
    <div>
      <PageHeader
        eyebrow="Refleksi Diri"
        title="Refleksi dan Aksi"
        description="Luangkan waktu untuk merenungi pembelajaran dan wujudkan dalam aksi nyata sehari-hari."
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.42fr]">
        <SectionCard>
          <ReflectionForm modules={modules} />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard variant="muted">
            <p className="font-bold text-ink">Panduan refleksi</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>1. Tulis hal yang paling kamu pahami.</li>
              <li>2. Hubungkan dengan pengalaman sehari-hari.</li>
              <li>3. Pilih satu aksi kecil yang realistis.</li>
            </ul>
          </SectionCard>

          <SectionCard>
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream text-gold">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-ink">Aksi yang baik</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Mulai dari hal kecil, terukur, dan bisa kamu lakukan hari ini. Refleksi yang disimpan akan ikut
                  memperbarui progress modul pilihanmu.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
