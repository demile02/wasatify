import { Lightbulb, Lock } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StudentReflectionCenterView } from '@/components/student/student-reflection-center-view';
import { ReflectionForm } from '@/components/student/reflection-form';
import { ReflectionModuleJumpSelect } from '@/components/student/reflection-module-jump-select';
import { Button } from '@/components/ui/button';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getReflectionCenterData, getReflectionPageData, type ReflectionModuleOption } from '@/lib/student/reflection';

type StudentReflectionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentReflectionPage({ searchParams }: StudentReflectionPageProps) {
  const query = await searchParams;
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const moduleId = getSearchValue(query.moduleId);

  if (!moduleId) {
    const centerData = await getReflectionCenterData(profile.id);
    return <StudentReflectionCenterView data={centerData} />;
  }

  const reflectionData = await getReflectionPageData(profile.id, moduleId);

  return (
    <div>
      <PageHeader eyebrow="Refleksi Diri" title="Refleksi dan Aksi" description="Renungkan pembelajaranmu dan wujudkan dalam tindakan nyata." />
      {reflectionData.locked || !reflectionData.selectedModule ? (
        <div className="mt-8 space-y-6">
          <ReflectionModuleJumpSelect modules={reflectionData.modules} selectedModuleId={reflectionData.selectedModule?.id} />
          <EmptyState
            icon={Lock}
            title={reflectionData.selectedModule ? 'Refleksi belum terbuka' : 'Modul tidak ditemukan'}
            description={reflectionData.lockedReason ?? 'Selesaikan syarat modul terlebih dahulu.'}
            action={<div className="flex flex-col gap-3 sm:flex-row"><Button asChild><Link href={reflectionData.lockedHref}>{reflectionData.lockedCtaLabel}</Link></Button><Button asChild variant="outline"><Link href="/student/reflection">Kembali ke Refleksi</Link></Button></div>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <ReflectionForm modules={reflectionData.modules} selectedModuleId={reflectionData.selectedModule.id} existingReflection={reflectionData.existingReflection} showCancel />
          <ReflectionGuide selectedModule={reflectionData.selectedModule} />
        </div>
      )}
    </div>
  );
}

function ReflectionGuide({ selectedModule }: { selectedModule: ReflectionModuleOption }) {
  return (
    <div className="space-y-5">
      <SectionCard variant="muted">
        <p className="font-bold text-ink">Modul refleksi</p>
        <p className="mt-2 font-extrabold text-primary">{selectedModule.title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedModule.description}</p>
        <ProgressBar value={selectedModule.progress} label="Progress modul" showValue className="mt-4" />
      </SectionCard>
      <SectionCard variant="muted">
        <p className="font-bold text-ink">Panduan refleksi</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground"><li>1. Tulis hal yang paling kamu pahami.</li><li>2. Hubungkan dengan pengalaman sehari-hari.</li><li>3. Pilih satu aksi kecil yang realistis.</li></ul>
      </SectionCard>
      <SectionCard><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream text-gold"><Lightbulb className="h-5 w-5" /></div><div><p className="font-bold text-ink">Aksi yang baik</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Mulai dari hal kecil dan konsisten. Setiap aksi membawa perubahan besar.</p></div></div></SectionCard>
    </div>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
