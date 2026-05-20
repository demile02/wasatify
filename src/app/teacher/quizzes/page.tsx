import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { TeacherQuizzesTable } from '@/components/teacher/teacher-quizzes-table';
import { Button } from '@/components/ui/button';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherQuizzes } from '@/lib/teacher/quizzes';

export default async function TeacherQuizzesPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const data = await getTeacherQuizzes(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Kuis & Evaluasi"
        title="Kuis & Evaluasi"
        description="Pantau semua kuis dari modul Anda, lihat attempt siswa, dan lanjutkan pengeditan kuis dari satu tempat."
        actions={
          <Button asChild>
            <Link href="/teacher/modules/new">
              <Plus className="h-4 w-4" />
              Buat Kuis
            </Link>
          </Button>
        }
      />

      <TeacherQuizzesTable quizzes={data.quizzes} modules={data.modules} />
    </div>
  );
}
