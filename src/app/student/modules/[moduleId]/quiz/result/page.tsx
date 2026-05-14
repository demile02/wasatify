import { ArrowLeft, ClipboardList, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getQuizResultData, type QuizResultData } from '@/lib/student/learning';

type QuizResultPageProps = {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentQuizResultPage({ params, searchParams }: QuizResultPageProps) {
  const [{ moduleId }, query] = await Promise.all([params, searchParams]);
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const attemptId = getSearchValue(query.attempt);
  const storedResult = await getQuizResultData(decodeURIComponent(moduleId), profile.id, attemptId);
  const queryResult = resultFromQuery(storedResult, query);
  const result = storedResult.available ? storedResult : queryResult;

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

      <div className="mx-auto mt-8 max-w-3xl">
        <SectionCard className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-cream text-gold shadow-card">
            <Star className="h-12 w-12 fill-current" />
          </div>
          <p className="mt-6 text-sm font-semibold text-muted-foreground">Skor Kamu</p>
          <h2 className="mt-2 text-6xl font-extrabold text-primary">
            {result.score} <span className="text-2xl text-muted-foreground">/ 100</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl rounded-2xl bg-mint px-4 py-3 text-sm font-semibold text-primary">
            {result.passed
              ? 'Hebat. Modul ini sudah selesai dan progresmu tersimpan.'
              : 'Kamu belum mencapai skor lulus. Pelajari pembahasan lalu coba kembali.'}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <ResultMetric label="Jawaban Benar" value={result.correctAnswers} />
            <ResultMetric label="Jawaban Salah" value={result.wrongAnswers} tone="danger" />
            <ResultMetric label="Waktu" value={formatDuration(result.elapsedSeconds)} />
          </div>

          <ProgressBar value={result.score} label="Performa Kamu" showValue className="mt-8" />

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button asChild>
              <Link href={`/student/modules/${result.module.id}`}>
                <ClipboardList className="h-4 w-4" />
                Lihat Pembahasan
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/modules">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Modul
              </Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function ResultMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'danger';
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={tone === 'danger' ? 'mt-2 text-2xl font-extrabold text-red-600' : 'mt-2 text-2xl font-extrabold text-ink'}>
        {value}
      </p>
    </div>
  );
}

function resultFromQuery(
  base: QuizResultData,
  query: Record<string, string | string[] | undefined>,
): QuizResultData {
  const score = parseNumber(query.score);
  const totalQuestions = parseNumber(query.total);
  const correctAnswers = parseNumber(query.correct);
  const elapsedSeconds = parseNumber(query.time);

  if (score === null || totalQuestions === null || correctAnswers === null) {
    return base;
  }

  return {
    ...base,
    score,
    totalQuestions,
    correctAnswers,
    wrongAnswers: Math.max(totalQuestions - correctAnswers, 0),
    elapsedSeconds: elapsedSeconds ?? 0,
    passed: getSearchValue(query.passed) === 'true',
    available: true,
  };
}

function parseNumber(value: string | string[] | undefined) {
  const rawValue = getSearchValue(value);
  if (!rawValue) return null;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}
