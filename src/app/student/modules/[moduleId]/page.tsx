import { BookOpen, Clock3, Layers3, Lock } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { LessonReader } from '@/components/student/lesson-reader';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getModuleLearningData } from '@/lib/student/learning';

type ModuleDetailPageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function StudentModuleDetailPage({ params }: ModuleDetailPageProps) {
  const { moduleId } = await params;
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const learningData = await getModuleLearningData(decodeURIComponent(moduleId), profile);

  if (!learningData.module) {
    return (
      <EmptyState
        title="Modul tidak ditemukan"
        description="Modul yang kamu cari belum tersedia atau belum dipublikasikan."
        action={
          <Button asChild>
            <Link href="/student/modules">Kembali ke Modul</Link>
          </Button>
        }
      />
    );
  }

  if (learningData.module.status === 'locked') {
    return (
      <EmptyState
        icon={Lock}
        title="Modul masih terkunci"
        description="Selesaikan modul sebelumnya untuk membuka materi ini."
        action={
          <Button asChild>
            <Link href="/student/modules">Lihat Modul Belajar</Link>
          </Button>
        }
      />
    );
  }

  const allLessonsComplete =
    learningData.lessons.length > 0 && learningData.completedLessonIds.length >= learningData.lessons.length;
  const quizStillRequired = learningData.module.progress === 90 && allLessonsComplete;

  return (
    <div>
      <PageHeader
        eyebrow={`Modul Belajar / ${learningData.module.title}`}
        title={learningData.module.title}
        description={learningData.module.description}
      />

      <SectionCard className="mt-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-3">
            <ModuleMeta icon={Layers3} label="Total Pelajaran" value={`${learningData.lessons.length} pelajaran`} />
            <ModuleMeta icon={Clock3} label="Estimasi" value={`${learningData.module.estimatedMinutes} menit`} />
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">Status Modul</p>
              <StatusBadge className="mt-2" status={learningData.module.status} />
            </div>
          </div>
          <div className="min-w-0">
            <ProgressBar value={learningData.module.progress} label="Progress Modul" showValue />
            {quizStillRequired && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Materi selesai. Lulus kuis untuk menuntaskan modul.
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {learningData.lessons.length ? (
        <div className="mt-8">
          <LessonReader
            moduleItem={learningData.module}
            lessons={learningData.lessons}
            completedLessonIds={learningData.completedLessonIds}
          />
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={BookOpen}
          title="Pelajaran belum tersedia"
          description="Guru belum menambahkan materi untuk modul ini."
        />
      )}
    </div>
  );
}

function ModuleMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="block font-bold text-ink">{value}</span>
      </span>
    </div>
  );
}
