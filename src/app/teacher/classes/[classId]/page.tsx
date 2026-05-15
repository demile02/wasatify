import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { TeacherClassDetailView } from '@/components/teacher/teacher-class-detail-view';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherClassDetailData } from '@/lib/teacher/analytics';

type TeacherClassDetailPageProps = {
  params: Promise<{ classId: string }>;
};

export default async function TeacherClassDetailPage({ params }: TeacherClassDetailPageProps) {
  const [{ classId }, profile] = await Promise.all([params, requireTeacher()]);
  const teacherProfile = profile ?? demoTeacherProfile;
  const data = await getTeacherClassDetailData(teacherProfile, decodeURIComponent(classId));

  if (!data.classInfo) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Kelas tidak ditemukan"
        description="Kelas yang Anda cari belum tersedia atau tidak dapat diakses."
        action={
          <Button asChild>
            <Link href="/teacher/classes">Kembali ke Kelas</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Detail Kelas"
        title={data.classInfo.name}
        description={
          data.classInfo.description ??
          [data.classInfo.gradeLevel, data.classInfo.academicYear].filter(Boolean).join(' - ') ??
          'Pantau progress, kuis, refleksi, dan aktivitas siswa.'
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/teacher/classes">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <TeacherClassDetailView data={data} />
    </div>
  );
}
