import { ClipboardList, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { QuizResult } from '@/components/student/quiz-result';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getQuizResultData } from '@/lib/student/learning';

type QuizResultPageProps = {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentQuizResultPage({ params, searchParams }: QuizResultPageProps) {
  const [{ moduleId }, query] = await Promise.all([params, searchParams]);
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const attemptId = getSearchValue(query.attemptId) ?? getSearchValue(query.attempt);
  const storedResult = await getQuizResultData(decodeURIComponent(moduleId), profile.id, attemptId);
  const result = storedResult;

  if (!result.module) {
    return (
      <EmptyState
        title="Hasil tidak ditemukan"
        description="Modul atau hasil kuis yang kamu cari belum tersedia."
        action={
          <Button asChild>
            <Link href="/student/modules">Kembali ke Modul</Link>
          </Button>
        }
      />
    );
  }

  if (!result.available) {
    return (
      <div>
        <PageHeader
          eyebrow="Hasil Kuis"
          title="Belum ada hasil kuis"
          description={`Kamu belum menyelesaikan kuis untuk modul ${result.module.title}.`}
        />
        <EmptyState
          className="mt-8"
          icon={ClipboardList}
          title="Hasil belum tersedia"
          description="Kerjakan kuis terlebih dahulu agar skor dan progres tersimpan."
          action={
            <Button asChild>
              <Link href={`/student/modules/${result.module.id}/quiz`}>
                Mulai Kuis <RotateCcw className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Hasil Kuis"
        title="Skor Kamu"
        description={`Hasil kuis untuk modul ${result.module.title}.`}
      />

      <QuizResult result={result} />
    </div>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
