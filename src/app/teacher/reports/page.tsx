import { TeacherReportsView } from '@/components/teacher/teacher-reports-view';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherReportsData } from '@/lib/teacher/analytics';

export default async function TeacherReportsPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const reportsData = await getTeacherReportsData(profile);

  return (
    <TeacherReportsView data={reportsData} />
  );
}
