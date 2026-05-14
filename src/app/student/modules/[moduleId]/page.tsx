import { BookOpen, Lock } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { LessonViewer } from '@/components/student/lesson-viewer';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getModuleLearningData } from '@/lib/student/learning';

type ModuleDetailPageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function StudentModuleDetailPage({ params }: ModuleDetailPageProps) {
  const { moduleId } = await params;
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const learningData = await getModuleLearningData(decodeURIComponent(moduleId), profile.id);

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

  return (
    <div>
      <PageHeader
        eyebrow="Detail Materi Modul"
        title={learningData.module.title}
        description={learningData.module.description}
        actions={<StatusBadge status={learningData.module.status} />}
      />

      {learningData.lessons.length ? (
        <div className="mt-8">
          <LessonViewer
            moduleItem={learningData.module}
            lessons={learningData.lessons}
            completedLessonIds={learningData.completedLessonIds}
          />
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={BookOpen}
          title="Lesson belum tersedia"
          description="Guru belum menambahkan materi untuk modul ini."
        />
      )}
    </div>
  );
}
