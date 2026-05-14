import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { QuizRunner } from '@/components/student/quiz-runner';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getQuizLearningData } from '@/lib/student/learning';

type QuizPageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function StudentQuizPage({ params }: QuizPageProps) {
  const { moduleId } = await params;
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const quizData = await getQuizLearningData(decodeURIComponent(moduleId), profile.id);

  if (!quizData.module) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Modul tidak ditemukan"
        description="Kuis belum bisa dibuka karena modul tidak tersedia."
        action={
          <Button asChild>
            <Link href="/student/modules">Kembali ke Modul</Link>
          </Button>
        }
      />
    );
  }

  if (!quizData.quiz) {
    return (
      <div>
        <PageHeader
          eyebrow="Kuis Pemahaman"
          title={`Kuis: ${quizData.module.title}`}
          description="Kuis untuk modul ini belum dipublikasikan."
        />
        <EmptyState
          className="mt-8"
          icon={ClipboardList}
          title="Kuis belum tersedia"
          description="Guru belum menambahkan kuis untuk modul ini."
          action={
            <Button asChild>
              <Link href={`/student/modules/${quizData.module.id}`}>Kembali ke Materi</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kuis Pemahaman"
        title={quizData.quiz.title}
        description={quizData.quiz.description ?? `Uji pemahamanmu setelah mempelajari ${quizData.module.title}.`}
      />

      <div className="mt-8">
        <QuizRunner moduleId={quizData.module.id} quiz={quizData.quiz} />
      </div>
    </div>
  );
}
