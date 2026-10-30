import { StudentDashboardView } from '@/components/student/student-dashboard-view';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentDashboardData } from '@/lib/student/data';

export default async function StudentDashboardPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const dashboard = await getStudentDashboardData(profile);
  return <StudentDashboardView profile={profile} dashboard={dashboard} />;
}
