'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lightbulb, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { submitQuizAttemptAction, type QuizAnswerMap } from '@/lib/student/actions';
import type { StudentQuiz } from '@/lib/student/learning';
import { cn } from '@/lib/utils';

type QuizRunnerProps = {
  moduleId: string;
  quiz: StudentQuiz;
};

export function QuizRunner({ moduleId, quiz }: QuizRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerMap>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = quiz.questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const progressPercent = totalQuestions ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  const temporaryCorrectAnswers = useMemo(
    () =>
      quiz.questions.reduce((total, question) => {
        const selected = answers[question.id];
        return total + (selected && selected === question.correctAnswer ? 1 : 0);
      }, 0),
    [answers, quiz.questions],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  if (!totalQuestions || !currentQuestion) {
    return (
      <SectionCard>
        <EmptyState
          title="Kuis belum memiliki pertanyaan"
          description="Pertanyaan akan tampil setelah guru mempublikasikan evaluasi untuk modul ini."
        />
      </SectionCard>
    );
  }

  const isLastQuestion = currentIndex === totalQuestions - 1;

  function selectAnswer(optionId: string) {
    if (selectedAnswer || isPending || !currentQuestion) return;
    setAnswers((current) => ({ ...current, [currentQuestion.id]: optionId }));
  }

  function goNext() {
    if (!selectedAnswer) return;
    setError(null);

    if (!isLastQuestion) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    startTransition(async () => {
      const result = await submitQuizAttemptAction({
        moduleId,
        quizId: quiz.id,
        answers,
        startedAt,
        elapsedSeconds,
      });

      if (!result.ok) {
        setError(result.error ?? 'Hasil kuis belum berhasil disimpan.');
        return;
      }

      const query = new URLSearchParams({
        score: String(result.score ?? 0),
        correct: String(result.correctAnswers ?? 0),
        total: String(result.totalQuestions ?? totalQuestions),
        time: String(result.elapsedSeconds ?? elapsedSeconds),
        passed: String(Boolean(result.passed)),
      });

      if (result.attemptId) {
        query.set('attempt', result.attemptId);
      }

      router.push(`/student/modules/${moduleId}/quiz/result?${query.toString()}`);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.34fr]">
      <SectionCard>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-5">
          <Link href={`/student/modules/${moduleId}`}>
            <ArrowLeft className="h-4 w-4" />
            Keluar Kuis
          </Link>
        </Button>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold">
            <span>
              Pertanyaan {currentIndex + 1} dari {totalQuestions}
            </span>
            <span className="text-primary">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} />
        </div>

        <h2 className="text-xl font-extrabold leading-relaxed text-ink">{currentQuestion.questionText}</h2>

        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = Boolean(selectedAnswer) && option.id === currentQuestion.correctAnswer;
            const isWrong = Boolean(selectedAnswer) && isSelected && option.id !== currentQuestion.correctAnswer;

            return (
              <button
                key={option.id}
                type="button"
                disabled={Boolean(selectedAnswer) || isPending}
                onClick={() => selectAnswer(option.id)}
                className={cn(
                  'flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition',
                  !selectedAnswer && 'border-border bg-white text-foreground hover:border-primary/35 hover:bg-mint/40',
                  isCorrect && 'border-primary bg-mint text-primary',
                  isWrong && 'border-red-200 bg-red-50 text-red-700',
                  selectedAnswer && !isCorrect && !isWrong && 'border-border bg-white text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-xl border font-bold uppercase',
                    isCorrect ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground',
                    isWrong && 'border-red-300 bg-red-600 text-white',
                  )}
                >
                  {option.id}
                </span>
                <span className="flex-1">{option.text}</span>
                {isCorrect && <CheckCircle2 className="h-5 w-5" />}
                {isWrong && <XCircle className="h-5 w-5" />}
              </button>
            );
          })}
        </div>

        {selectedAnswer && currentQuestion.showExplanation && currentQuestion.explanation && (
          <div className="mt-6 rounded-2xl border border-gold/20 bg-cream p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 text-gold" />
              <div>
                <p className="font-bold text-ink">Penjelasan Singkat</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button type="button" onClick={goNext} disabled={!selectedAnswer || isPending}>
            {isPending ? 'Menyimpan...' : isLastQuestion ? 'Lihat Hasil' : 'Pertanyaan Selanjutnya'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SectionCard>

      <div className="space-y-5">
        <SectionCard>
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-bold text-ink shadow-sm">
            <Clock className="h-4 w-4 text-gold" />
            {formatDuration(elapsedSeconds)}
          </div>
          <p className="mt-5 font-bold text-ink">Ringkasan Kuis</p>
          <div className="mt-5 space-y-4 text-sm">
            <SummaryRow label="Terjawab" value={`${answeredCount}/${totalQuestions}`} />
            <SummaryRow label="Benar sementara" value={temporaryCorrectAnswers} valueClassName="text-primary" />
            <SummaryRow
              label="Sisa pertanyaan"
              value={Math.max(totalQuestions - answeredCount, 0)}
              valueClassName="text-gold"
              last
            />
          </div>
        </SectionCard>

        <SectionCard variant="muted">
          <p className="font-bold text-ink">Aturan Kuis</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pilih satu jawaban terbaik. Pembahasan muncul setelah jawaban dipilih, lalu hasil disimpan saat semua
            pertanyaan selesai.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
  last = false,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
  last?: boolean;
}) {
  return (
    <div className={cn('flex justify-between gap-4', !last && 'border-b border-border pb-3')}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-bold text-ink', valueClassName)}>{value}</span>
    </div>
  );
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
