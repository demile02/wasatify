import { Lightbulb, Lock } from 'lucide-react';
import { ReflectionForm } from '@/components/student/reflection-form';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getReflectionPageData } from '@/lib/student/reflection';
import Link from 'next/link';

type StudentReflectionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentReflectionPage({ searchParams }: StudentReflectionPageProps) {
  const query = await searchParams;
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const moduleId = getSearchValue(query.moduleId);
  const reflectionData = await getReflectionPageData(profile.id, moduleId);

  return (
    <div>
      <PageHeader
        eyebrow="Refleksi Diri"
        title="Refleksi dan Aksi"
        description="Renungkan pembelajaranmu dan wujudkan dalam tindakan nyata."
      />

      {reflectionData.locked ? (
        <EmptyState
          className="mt-8"
          icon={Lock}
          title="Modul masih terkunci"
          description="Selesaikan modul sebelumnya sebelum menulis refleksi untuk modul ini."
          action={
            <Button asChild>
              <Link href="/student/modules">Kembali ke Modul</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <ReflectionForm
            modules={reflectionData.modules}
            selectedModuleId={reflectionData.selectedModule?.id}
            existingReflection={reflectionData.existingReflection}
          />

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
                    Mulai dari hal kecil dan konsisten. Setiap aksi membawa perubahan besar.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
