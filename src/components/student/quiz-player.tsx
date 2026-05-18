'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { submitQuizAttemptAction, type QuizAnswerMap } from '@/lib/student/actions';
import type { QuizQuestion, StudentQuiz, StudentQuizAttemptInfo } from '@/lib/student/learning';
import { cn } from '@/lib/utils';

type QuizPlayerProps = {
  moduleId: string;
  quiz: StudentQuiz;
  attemptInfo?: StudentQuizAttemptInfo;
  studentId: string;
};

type QuizDraftPayload = {
  quizId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  answers: QuizAnswerMap;
  updatedAt: string;
};

export function QuizPlayer({ moduleId, quiz, attemptInfo, studentId }: QuizPlayerProps) {
  const router = useRouter();
  const attemptNumber = (attemptInfo?.attemptsCount ?? 0) + 1;
  const draftKey = `wasatify:quiz-draft:${studentId}:${quiz.id}:${attemptNumber}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerMap>({});
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = quiz.questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = quiz.questions.filter((question) => Boolean(answers[question.id])).length;
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
    try {
      removeQuizDrafts(studentId, quiz.id, draftKey);
      const rawDraft = window.localStorage.getItem(draftKey);
      if (!rawDraft) return;

      const draft = JSON.parse(rawDraft) as QuizDraftPayload;
      const validDraft =
        draft?.quizId === quiz.id &&
        draft.studentId === studentId &&
        draft.attemptNumber === attemptNumber &&
        typeof draft.startedAt === 'string' &&
        draft.answers &&
        typeof draft.answers === 'object';

      if (!validDraft) {
        window.localStorage.removeItem(draftKey);
        return;
      }

      setStartedAt(draft.startedAt);
      setAnswers(normalizeDraftAnswers(draft.answers, quiz.questions.map((question) => question.id)));
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [attemptNumber, draftKey, quiz.id, quiz.questions, studentId]);

  useEffect(() => {
    if (!Object.keys(answers).length) return;

    try {
      const draft: QuizDraftPayload = {
        quizId: quiz.id,
        studentId,
        attemptNumber,
        startedAt,
        answers,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // Local draft is best-effort only. Supabase attempt remains the source of truth after submit.
    }
  }, [answers, attemptNumber, draftKey, quiz.id, startedAt, studentId]);

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
    if (isPending || !currentQuestion) return;
    if (answers[currentQuestion.id]) return;

    setAnswers((current) => {
      if (current[currentQuestion.id]) return current;
      return { ...current, [currentQuestion.id]: optionId };
    });
  }

  function goPrevious() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function goNext() {
    if (!answers[currentQuestion.id]) {
      toast.warning('Pilih jawaban terlebih dahulu.');
      return;
    }

    if (!isLastQuestion) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    submitQuiz();
  }

  function submitQuiz() {
    const unanswered = quiz.questions.find((question) => !answers[question.id]);
    if (unanswered) {
      toast.warning('Masih ada pertanyaan yang belum dijawab.');
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
        toast.error(result.error ?? 'Hasil kuis belum berhasil disimpan.');
        return;
      }

      toast.success('Hasil kuis tersimpan.');
      window.localStorage.removeItem(draftKey);
      const query = new URLSearchParams();
      if (result.attemptId) query.set('attemptId', result.attemptId);
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
            <span>Pertanyaan {currentIndex + 1} dari {totalQuestions}</span>
            <span className="text-primary">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} />
          {attemptInfo && (
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              Percobaan {attemptInfo.attemptsCount + 1} dari {attemptInfo.maxAttempts}
            </p>
          )}
        </div>

        <h2 className="text-xl font-extrabold leading-relaxed text-ink">{currentQuestion.questionText}</h2>

        {currentQuestion.options.length ? (
          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option, index) => (
              <OptionCard
                key={option.id}
                question={currentQuestion}
                optionId={option.id}
                optionText={option.text}
                label={optionLabel(index)}
                selectedAnswer={selectedAnswer}
                onSelect={() => selectAnswer(option.id)}
                disabled={isPending || Boolean(selectedAnswer)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-6"
            title="Tipe pertanyaan belum didukung"
            description="Pertanyaan ini belum memiliki pilihan jawaban yang bisa dikerjakan."
          />
        )}

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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={goPrevious} disabled={currentIndex === 0 || isPending}>
            <ArrowLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <Button type="button" onClick={goNext} disabled={isPending || !answers[currentQuestion.id]}>
            {isPending ? 'Menyimpan...' : isLastQuestion ? 'Selesaikan Kuis' : 'Selanjutnya'}
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
            <SummaryRow label="Nilai kelulusan" value={`${quiz.passingScore}%`} valueClassName="text-gold" />
            <SummaryRow
              label="Kesempatan"
              value={attemptInfo ? `${attemptInfo.attemptsCount + 1}/${attemptInfo.maxAttempts}` : quiz.maxAttempts}
              last
            />
          </div>
        </SectionCard>

        <SectionCard variant="muted">
          <p className="font-bold text-ink">Aturan Kuis</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Jawab semua pertanyaan sebelum menyelesaikan kuis. Pembahasan ringkas muncul setelah kamu memilih jawaban.
          </p>
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setCurrentIndex(0)}>
            <RotateCcw className="h-4 w-4" />
            Kembali ke Awal
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}

export function QuizDraftCleanup({ studentId, quizId }: { studentId: string; quizId: string }) {
  useEffect(() => {
    removeQuizDrafts(studentId, quizId);
  }, [quizId, studentId]);

  return null;
}

function OptionCard({
  question,
  optionId,
  optionText,
  label,
  selectedAnswer,
  onSelect,
  disabled,
}: {
  question: QuizQuestion;
  optionId: string;
  optionText: string;
  label: string;
  selectedAnswer?: string;
  onSelect: () => void;
  disabled: boolean;
}) {
  const selectedIds = splitAnswer(selectedAnswer);
  const hasAnswer = selectedIds.length > 0;
  const isSelected = selectedIds.includes(optionId);
  const correctIds = splitAnswer(question.correctAnswer);
  const isCorrectOption = hasAnswer && correctIds.includes(optionId);
  const isWrongSelected = hasAnswer && isSelected && !correctIds.includes(optionId);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition',
        !hasAnswer && 'border-border bg-white text-foreground hover:border-primary/35 hover:bg-mint/40',
        isSelected && !isWrongSelected && !isCorrectOption && 'border-primary/40 bg-mint/50 text-primary',
        isCorrectOption && 'border-primary bg-mint text-primary',
        isWrongSelected && 'border-red-200 bg-red-50 text-red-700',
        hasAnswer && !isSelected && !isCorrectOption && 'border-border bg-white text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-xl border font-bold uppercase',
          isCorrectOption ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground',
          isWrongSelected && 'border-red-300 bg-red-600 text-white',
        )}
      >
        {label}
      </span>
      <span className="flex-1">{optionText}</span>
      {isCorrectOption && <CheckCircle2 className="h-5 w-5" />}
      {isWrongSelected && <XCircle className="h-5 w-5" />}
    </button>
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

function splitAnswer(answer?: string) {
  return answer ? answer.split('|').filter(Boolean) : [];
}

function removeQuizDrafts(studentId: string, quizId: string, keepKey?: string) {
  const prefix = `wasatify:quiz-draft:${studentId}:${quizId}:`;
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(prefix) || key === keepKey) continue;
    window.localStorage.removeItem(key);
  }
}

function normalizeDraftAnswers(answers: QuizAnswerMap, questionIds: string[]) {
  const questionIdSet = new Set(questionIds);

  return Object.fromEntries(
    Object.entries(answers).filter(
      ([questionId, answer]) => questionIdSet.has(questionId) && typeof answer === 'string' && answer.trim(),
    ),
  );
}

function optionLabel(index: number) {
  return String.fromCharCode(65 + index);
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
