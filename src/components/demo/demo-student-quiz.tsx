'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { studentDemoQuiz } from '@/lib/demo/workspace-data';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { useQuizAutoScroll } from '@/hooks/use-quiz-auto-scroll';
import { cn } from '@/lib/utils';

export type DemoQuizAttempt = { score: number; correct: number; submittedAt: string };

export function DemoStudentQuiz({
  attempts,
  onSubmit,
  basePath = '/demo/students',
  moduleId = 'tawazun',
}: {
  attempts: DemoQuizAttempt[];
  onSubmit: (attempt: DemoQuizAttempt) => void;
  basePath?: string;
  moduleId?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<DemoQuizAttempt | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const currentQuestion = studentDemoQuiz[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const { questionHeadingRef, feedbackActionsRef } = useQuizAutoScroll(currentIndex, selectedAnswer);
  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(
    () => studentDemoQuiz.reduce((count, question, index) => count + Number(answers[index] === question.answer), 0),
    [answers],
  );
  const progress = Math.round(((currentIndex + 1) / studentDemoQuiz.length) * 100);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  function selectAnswer(optionId: string) {
    if (selectedAnswer || result) return;
    setAnswers((current) => ({ ...current, [currentIndex]: optionId }));
  }

  function moveNext() {
    if (!selectedAnswer) return;
    if (currentIndex < studentDemoQuiz.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    const attempt: DemoQuizAttempt = {
      score: Math.round((correctCount / studentDemoQuiz.length) * 100),
      correct: correctCount,
      submittedAt: new Date().toISOString(),
    };
    onSubmit(attempt);
    setResult(attempt);
  }

  function retryQuiz() {
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }

  if (!currentQuestion) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.34fr]">
      <SectionCard>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-5">
          <Link href={`${basePath}/modules/${moduleId}`}>
            <ArrowLeft className="h-4 w-4" />
            Keluar Kuis
          </Link>
        </Button>

        {!result ? (
          <>
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold">
                <span>Pertanyaan {currentIndex + 1} dari {studentDemoQuiz.length}</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>

            <h2 ref={questionHeadingRef} className="scroll-mt-48 text-xl font-extrabold leading-relaxed text-ink lg:scroll-mt-24">
              {currentQuestion.prompt}
            </h2>
            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option.id;
                const isCorrect = Boolean(selectedAnswer) && option.id === currentQuestion.answer;
                const isWrong = Boolean(selectedAnswer) && isSelected && option.id !== currentQuestion.answer;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={Boolean(selectedAnswer)}
                    onClick={() => selectAnswer(option.id)}
                    className={cn(
                      'flex min-h-14 w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition',
                      !selectedAnswer && 'border-border bg-white text-foreground hover:border-primary/35 hover:bg-mint/40',
                      isCorrect && 'border-primary bg-mint text-primary',
                      isWrong && 'border-red-200 bg-red-50 text-red-700',
                      selectedAnswer && !isCorrect && !isWrong && 'border-border bg-white text-muted-foreground',
                    )}
                  >
                    <span className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-xl border font-bold uppercase',
                      isCorrect ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground',
                      isWrong && 'border-red-300 bg-red-600 text-white',
                    )}>{option.id}</span>
                    <span className="min-w-0 flex-1">{option.text}</span>
                    {isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                    {isWrong && <XCircle className="h-5 w-5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div ref={feedbackActionsRef} className="scroll-mb-28 lg:scroll-mb-6">
              {selectedAnswer && currentQuestion.explanation && (
                <div className="mt-6 rounded-2xl border border-gold/20 bg-cream p-5">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="font-bold text-ink">Penjelasan Singkat</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))} disabled={currentIndex === 0}>
                  <ArrowLeft className="h-4 w-4" />Sebelumnya
                </Button>
                <Button type="button" onClick={moveNext} disabled={!selectedAnswer}>
                  {currentIndex === studentDemoQuiz.length - 1 ? 'Selesaikan Kuis' : 'Selanjutnya'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-mint/45 p-5">
              <p className="text-sm font-bold text-primary">Hasil latihan demo</p>
              <p className="mt-2 text-3xl font-extrabold text-ink">{result.score}/100</p>
              <p className="mt-1 text-sm text-muted-foreground">{result.correct} dari {studentDemoQuiz.length} jawaban benar · {result.score >= 70 ? 'Lulus' : 'Belum mencapai KKM 70'}</p>
              <Button type="button" variant="outline" className="mt-4" onClick={retryQuiz}><RotateCcw className="h-4 w-4" />Ulangi kuis</Button>
            </div>
            <div className="mt-6 space-y-3">
              {studentDemoQuiz.map((question, index) => {
                const correct = answers[index] === question.answer;
                const selected = question.options.find((option) => option.id === answers[index]);
                const correctOption = question.options.find((option) => option.id === question.answer);
                return (
                  <div key={question.prompt} className="rounded-2xl border border-border bg-white p-4">
                    <p className="font-bold text-ink">{index + 1}. {question.prompt}</p>
                    <p className={cn('mt-2 text-sm font-semibold', correct ? 'text-primary' : 'text-red-700')}>Jawabanmu: {selected?.text ?? 'Belum dijawab'}</p>
                    {!correct && <p className="mt-1 text-sm font-semibold text-primary">Jawaban benar: {correctOption?.text}</p>}
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.explanation}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SectionCard>

      <div className="space-y-5">
        <SectionCard>
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-bold text-ink shadow-sm">
            <Clock className="h-4 w-4 text-gold" />{formatDuration(elapsedSeconds)}
          </div>
          <p className="mt-5 font-bold text-ink">Ringkasan Kuis</p>
          <div className="mt-5 space-y-4 text-sm">
            <SummaryRow label="Terjawab" value={`${answeredCount}/${studentDemoQuiz.length}`} />
            <SummaryRow label="Benar sementara" value={correctCount} valueClassName="text-primary" />
            <SummaryRow label="Sisa pertanyaan" value={Math.max(studentDemoQuiz.length - answeredCount, 0)} valueClassName="text-gold" last />
          </div>
        </SectionCard>
        <SectionCard variant="muted">
          <p className="font-bold text-ink">Aturan Kuis</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Pilih satu jawaban terbaik. Penjelasan tampil setelah jawaban dipilih. Nilai demo dihitung di browser dan tidak mengubah akun asli.</p>
          {attempts.length > 0 && <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">Percobaan sebelumnya: {attempts.length}. Nilai terakhir {attempts[0].score}/100.</p>}
        </SectionCard>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, valueClassName, last = false }: { label: string; value: string | number; valueClassName?: string; last?: boolean }) {
  return <div className={cn('flex justify-between gap-4', !last && 'border-b border-border pb-3')}><span className="text-muted-foreground">{label}</span><span className={cn('font-bold text-ink', valueClassName)}>{value}</span></div>;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
