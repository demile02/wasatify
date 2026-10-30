import { ArrowRight, ClipboardCheck, History, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { QuizRetakeButton } from '@/components/student/quiz-retake-button';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import {
  type StudentQuizCenterData,
  type StudentQuizCenterQuiz,
  type StudentQuizHistoryItem,
} from '@/lib/student/quizzes';

export function StudentQuizCenterView({ quizData, basePath = '/student' }: { quizData: StudentQuizCenterData; basePath?: string }) {
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
            <div className={quizData.available.length === 1 ? 'grid gap-4' : 'grid gap-4 lg:grid-cols-2'}>
              {quizData.available.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  basePath={basePath}
                  action={
                    <Button asChild>
                      <Link href={basePath.startsWith('/demo/') ? `${basePath}/quizzes/${quiz.moduleId}` : `${basePath}/modules/${quiz.moduleId}/quiz`}>
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
            <div className={quizData.waiting.length === 1 ? 'grid gap-4' : 'grid gap-4 lg:grid-cols-2'}>
              {quizData.waiting.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  basePath={basePath}
                  disabled
                  action={
                    <Button asChild variant="outline">
                      <Link href={`${basePath}/modules/${quiz.moduleId}`}>
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
              <div className={quizData.exhausted.length === 1 ? 'grid gap-4' : 'grid gap-4 lg:grid-cols-2'}>
                {quizData.exhausted.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    basePath={basePath}
                    tone="blocked"
                    action={
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {quiz.latestAttemptId && (
                          basePath.startsWith('/demo/')
                            ? <p className="self-center text-xs font-semibold text-muted-foreground">Riwayat percobaan tersedia di bawah.</p>
                            : <Button asChild><Link href={`${basePath}/modules/${quiz.moduleId}/quiz/result?attemptId=${quiz.latestAttemptId}`}>Lihat Hasil Terakhir</Link></Button>
                        )}
                        {quiz.hasPassed && !quiz.hasReflection && (
                          <Button asChild variant="outline">
                            <Link href={`${basePath}/reflection?moduleId=${quiz.moduleId}`}>Lanjut Refleksi</Link>
                          </Button>
                        )}
                      </div>
                    }
                  />
                ))}
              </div>
            )}

            {quizData.history.length ? (
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-card">
                {quizData.history.map((attempt) => (
                  <HistoryRow key={attempt.id} attempt={attempt} basePath={basePath} />
                ))}
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
  basePath,
  disabled = false,
  tone = 'default',
}: {
  quiz: StudentQuizCenterQuiz;
  action: ReactNode;
  basePath: string;
  disabled?: boolean;
  tone?: 'default' | 'blocked';
}) {
  const attemptsLabel = `${quiz.attemptsUsed}/${quiz.maxAttempts} kesempatan`;
  const attemptsExhausted = quiz.attemptsUsed >= quiz.maxAttempts;

  return (
    <SectionCard className={disabled ? 'opacity-90' : undefined}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">{quiz.category}</span>
              {tone === 'blocked' && (
                <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-gold">Kesempatan habis</span>
              )}
            </div>
            <h3 className="mt-3 line-clamp-2 text-lg font-extrabold text-ink">{quiz.title}</h3>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-primary">{quiz.moduleTitle}</p>
          </div>
          {tone === 'blocked' && !basePath.startsWith('/demo/') ? (
            <QuizRetakeButton
              moduleId={quiz.moduleId}
              allowRetake={quiz.allowRetake}
              attemptsUsed={quiz.attemptsUsed}
              maxAttempts={quiz.maxAttempts}
              iconOnly
            />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
              {tone === 'blocked' ? <Lock className="h-6 w-6" /> : <ClipboardCheck className="h-6 w-6" />}
            </div>
          )}
        </div>

        {quiz.description && <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{quiz.description}</p>}

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
            {quiz.allowRetake
              ? attemptsExhausted
                ? 'Batas kesempatan mengulang sudah tercapai. Hubungi guru untuk meminta tambahan.'
                : 'Kamu masih bisa mengulang kuis sesuai batas kesempatan.'
              : 'Kuis ini tidak mengizinkan pengulangan.'}
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

function HistoryRow({ attempt, basePath }: { attempt: StudentQuizHistoryItem; basePath: string }) {
  const scoreTone = attempt.passed
    ? 'border-primary/15 bg-mint/40 text-primary'
    : 'border-red-200 bg-red-50 text-red-700';

  return (
    <article className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 font-bold text-ink">{attempt.quizTitle}</p>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-muted-foreground">{attempt.moduleTitle}</p>
          </div>
          <div className={`shrink-0 rounded-xl border px-3 py-2 text-center ${scoreTone}`}>
            <p className="text-[11px] font-bold">{attempt.passed ? 'Lulus' : 'Belum lulus'}</p>
            <p className="mt-0.5 text-lg font-extrabold leading-5">
              {attempt.score}<span className="ml-0.5 text-xs font-semibold">/100</span>
            </p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <HistoryMetric label="Percobaan" value={`#${attempt.attemptNumber}`} />
          <HistoryMetric label="Nilai terbaik" value={`${attempt.bestScore}/100`} />
          <HistoryMetric label="Waktu" value={formatDateTime(attempt.submittedAt)} className="col-span-2 sm:col-span-1" />
        </dl>
      </div>
      <div className="flex min-w-0 flex-wrap gap-2 lg:justify-end">
        {basePath.startsWith('/demo/')
          ? attempt.canRetake
            ? <Button asChild variant="outline" className="min-h-11 flex-1 sm:flex-none"><Link href={`${basePath}/quizzes/${attempt.moduleId}`}>Coba Lagi</Link></Button>
            : <span className="self-center text-xs font-semibold text-muted-foreground">Batas tercapai</span>
          : <Button asChild className="min-h-11 flex-1 sm:flex-none"><Link href={`${basePath}/modules/${attempt.moduleId}/quiz/result?attemptId=${attempt.id}`}>Lihat Hasil</Link></Button>}
        {basePath.startsWith('/demo/') ? null : <QuizRetakeButton
          moduleId={attempt.moduleId}
          allowRetake={attempt.allowRetake}
          attemptsUsed={attempt.attemptsUsed}
          maxAttempts={attempt.maxAttempts}
          size="default"
        />}
        {attempt.hasPassed && !attempt.hasReflection && (
          <Button asChild variant="gold" className="min-h-11 flex-1 sm:flex-none">
            <Link href={`${basePath}/reflection?moduleId=${attempt.moduleId}`}>Lanjut Refleksi</Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function HistoryMetric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`min-w-0 rounded-xl bg-background px-3 py-2 ${className ?? ''}`}>
      <dt className="text-[11px] font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-xs font-bold text-ink">{value}</dd>
    </div>
  );
}
