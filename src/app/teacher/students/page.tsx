import { TeacherStudentRosterView } from '@/components/teacher/teacher-student-roster-view';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherStudentRoster } from '@/lib/teacher/classes';

export default async function TeacherStudentsPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const students = await getTeacherStudentRoster(profile);
  return <TeacherStudentRosterView students={students} />;
}
