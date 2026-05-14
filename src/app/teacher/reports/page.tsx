import { PageHeader } from '@/components/shared/page-header';
import { TeacherReportsView } from '@/components/teacher/teacher-reports-view';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherReportsData } from '@/lib/teacher/analytics';

export default async function TeacherReportsPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const reportsData = await getTeacherReportsData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Laporan"
        title="Laporan dan Analitik"
        description="Analisis progress kelas, nilai kuis, refleksi terkumpul, dan aktivitas belajar siswa."
      />

      <TeacherReportsView data={reportsData} />
    </div>
  );
}
