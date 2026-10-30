import { StudentQuizCenterView } from '@/components/student/student-quiz-center-view';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentQuizCenterData } from '@/lib/student/quizzes';

export default async function StudentQuizzesPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const quizData = await getStudentQuizCenterData(profile);

  return <StudentQuizCenterView quizData={quizData} />;
}
