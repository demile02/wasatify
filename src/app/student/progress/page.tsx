import { StudentProgressView } from '@/components/student/student-progress-view';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentProgressData } from '@/lib/student/progress';

export default async function StudentProgressPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const progressData = await getStudentProgressData(profile.id);

  return <StudentProgressView data={progressData} />;
}
