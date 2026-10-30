import { TeacherDashboardView } from '@/components/teacher/teacher-dashboard-view';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherDashboardData } from '@/lib/teacher/data';

export default async function TeacherDashboardPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const dashboard = await getTeacherDashboardData(profile);
  return <TeacherDashboardView profile={profile} dashboard={dashboard} />;
}
