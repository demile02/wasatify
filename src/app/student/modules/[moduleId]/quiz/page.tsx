import { ArrowLeft, ClipboardList, Lock } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { QuizPlayer } from '@/components/student/quiz-player';
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

  if (quizData.module.status === 'locked') {
    return (
      <EmptyState
        icon={Lock}
        title="Kuis masih terkunci"
        description="Selesaikan modul sebelumnya untuk membuka kuis ini."
        action={
          <Button asChild>
            <Link href="/student/modules">Lihat Modul Belajar</Link>
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

  if (quizData.attemptInfo && !quizData.attemptInfo.canAttempt) {
    return (
      <div>
        <PageHeader
          eyebrow="Kuis Pemahaman"
          title="Kesempatan kuis sudah habis"
          description={`Kamu sudah menggunakan ${quizData.attemptInfo.attemptsCount} dari ${quizData.attemptInfo.maxAttempts} kesempatan untuk modul ${quizData.module.title}.`}
        />
        <EmptyState
          className="mt-8"
          icon={ClipboardList}
          title="Kesempatan kuis sudah habis"
          description={
            quizData.attemptInfo.bestScore === null
              ? 'Kamu belum bisa mengulang kuis ini.'
              : `Nilai terbaik kamu: ${quizData.attemptInfo.bestScore}/100.`
          }
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href={`/student/modules/${quizData.module.id}`}>Kembali ke Modul</Link>
              </Button>
              {quizData.attemptInfo.latestAttemptId && (
                <Button asChild>
                  <Link href={`/student/modules/${quizData.module.id}/quiz/result?attemptId=${quizData.attemptInfo.latestAttemptId}`}>
                    Lihat Hasil Terakhir
                  </Link>
                </Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kuis Pemahaman"
        title="Kuis Pemahaman"
        description={
          quizData.attemptInfo
            ? `${quizData.module.title} • Percobaan ${quizData.attemptInfo.attemptsCount + 1} dari ${quizData.attemptInfo.maxAttempts}`
            : quizData.module.title
        }
        actions={
          <Button asChild variant="outline">
            <Link href={`/student/modules/${quizData.module.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <div className="mt-8">
        <QuizPlayer
          moduleId={quizData.module.id}
          quiz={quizData.quiz}
          attemptInfo={quizData.attemptInfo ?? undefined}
          studentId={profile.id}
        />
      </div>
    </div>
  );
}
