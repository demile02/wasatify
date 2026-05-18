import { ArrowRight, ClipboardCheck, History, Lock, RotateCcw, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { requireStudent } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/date';
import { demoStudentProfile } from '@/lib/demo/student';
import {
  getStudentQuizCenterData,
  type StudentQuizCenterQuiz,
  type StudentQuizHistoryItem,
} from '@/lib/student/quizzes';

export default async function StudentQuizzesPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const quizData = await getStudentQuizCenterData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Pusat Kuis"
        title="Kuis"
        description="Kerjakan kuis yang tersedia dan lihat riwayat hasilmu."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <SummaryCard label="Kuis Tersedia" value={quizData.available.length} icon={ClipboardCheck} />
        <SummaryCard label="Menunggu Syarat" value={quizData.waiting.length} icon={Lock} />
        <SummaryCard label="Riwayat Kuis" value={quizData.history.length} icon={History} />
      </div>

      <div className="mt-8 grid gap-8">
        <QuizSection title="Kuis Tersedia" description="Kuis yang sudah bisa kamu kerjakan sekarang.">
          {quizData.available.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {quizData.available.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  action={
                    <Button asChild>
                      <Link href={`/student/modules/${quiz.moduleId}/quiz`}>
                        Kerjakan Kuis <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Belum ada kuis yang bisa dikerjakan"
              description="Selesaikan materi modul terlebih dahulu atau tunggu guru mempublikasikan kuis."
              className="min-h-52"
            />
          )}
        </QuizSection>

        <QuizSection title="Menunggu Syarat" description="Kuis berikut akan terbuka setelah modulnya selesai.">
          {quizData.waiting.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {quizData.waiting.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  disabled
                  action={
                    <Button asChild variant="outline">
                      <Link href={`/student/modules/${quiz.moduleId}`}>
                        Selesaikan Modul Terlebih Dahulu
                      </Link>
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Lock}
              title="Tidak ada kuis yang menunggu syarat"
              description="Kuis yang belum terbuka akan tampil di sini."
              className="min-h-52"
            />
          )}
        </QuizSection>

        <QuizSection title="Riwayat Kuis" description="Semua attempt kuis yang sudah pernah kamu submit.">
          <div className="grid gap-5">
            {quizData.exhausted.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {quizData.exhausted.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    tone="blocked"
                    action={
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {quiz.latestAttemptId && (
                          <Button asChild>
                            <Link href={`/student/modules/${quiz.moduleId}/quiz/result?attemptId=${quiz.latestAttemptId}`}>
                              Lihat Hasil Terakhir
                            </Link>
                          </Button>
                        )}
                        {quiz.hasPassed && !quiz.hasReflection && (
                          <Button asChild variant="outline">
                            <Link href={`/student/reflection?moduleId=${quiz.moduleId}`}>Lanjut Refleksi</Link>
                          </Button>
                        )}
                      </div>
                    }
                  />
                ))}
              </div>
            )}

            {quizData.history.length ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
                <div className="hidden grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.75fr_0.7fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground lg:grid">
                  <span>Kuis</span>
                  <span>Modul</span>
                  <span>Attempt</span>
                  <span>Skor</span>
                  <span>Waktu</span>
                  <span>Aksi</span>
                </div>
                <div className="divide-y divide-border">
                  {quizData.history.map((attempt) => (
                    <HistoryRow key={attempt.id} attempt={attempt} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="Belum ada riwayat kuis"
                description="Riwayat akan muncul setelah kamu menyelesaikan kuis."
                className="min-h-52"
              />
            )}
          </div>
        </QuizSection>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <SectionCard className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-ink">{value}</p>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
      </div>
    </SectionCard>
  );
}

function QuizSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function QuizCard({
  quiz,
  action,
  disabled = false,
  tone = 'default',
}: {
  quiz: StudentQuizCenterQuiz;
  action: ReactNode;
  disabled?: boolean;
  tone?: 'default' | 'blocked';
}) {
  const attemptsLabel = `${quiz.attemptsUsed}/${quiz.maxAttempts} kesempatan`;

  return (
    <SectionCard className={disabled ? 'opacity-90' : undefined}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">{quiz.category}</span>
              {tone === 'blocked' && (
                <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-gold">Kesempatan habis</span>
              )}
            </div>
            <h3 className="mt-3 line-clamp-2 text-lg font-extrabold text-ink">{quiz.title}</h3>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-primary">{quiz.moduleTitle}</p>
            {quiz.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{quiz.description}</p>}
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
            {tone === 'blocked' ? <RotateCcw className="h-6 w-6" /> : <ClipboardCheck className="h-6 w-6" />}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MiniMetric label="Nilai Kelulusan" value={`${quiz.passingScore}`} />
          <MiniMetric label="Percobaan" value={attemptsLabel} />
          <MiniMetric label="Nilai Terbaik" value={quiz.bestScore === null ? '-' : `${quiz.bestScore}`} />
        </div>

        {!quiz.prerequisiteMet && (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Progress modul</span>
              <span>{quiz.moduleProgress}%</span>
            </div>
            <ProgressBar value={quiz.moduleProgress} />
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            {quiz.allowRetake ? 'Mengulang diizinkan sampai batas kesempatan.' : 'Kuis ini tidak mengizinkan pengulangan.'}
          </p>
          <div className="shrink-0">{action}</div>
        </div>
      </div>
    </SectionCard>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-extrabold text-ink">{value}</p>
    </div>
  );
}

function HistoryRow({ attempt }: { attempt: StudentQuizHistoryItem }) {
  return (
    <div className="grid gap-3 px-4 py-4 lg:grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.75fr_0.7fr] lg:items-center">
      <div className="min-w-0">
        <p className="line-clamp-1 font-bold text-ink">{attempt.quizTitle}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground lg:hidden">{attempt.moduleTitle}</p>
      </div>
      <p className="hidden min-w-0 truncate text-sm font-semibold text-muted-foreground lg:block">{attempt.moduleTitle}</p>
      <p className="text-sm font-bold text-ink">#{attempt.attemptNumber}</p>
      <div className="flex items-center gap-2">
        <span className={attempt.passed ? 'text-primary' : 'text-gold'}>
          <Trophy className="h-4 w-4" />
        </span>
        <span className="font-extrabold text-ink">{attempt.score}</span>
        <span className="text-xs text-muted-foreground">best {attempt.bestScore}</span>
      </div>
      <p className="text-sm text-muted-foreground">{formatDateTime(attempt.submittedAt)}</p>
      <Button asChild variant="outline" size="sm" className="w-fit">
        <Link href={`/student/modules/${attempt.moduleId}/quiz/result?attemptId=${attempt.id}`}>Lihat Hasil</Link>
      </Button>
    </div>
  );
}
