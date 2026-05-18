'use client';

import { ArrowLeft, BookOpenCheck, ClipboardList, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import type { QuizResultData } from '@/lib/student/learning';
import { cn } from '@/lib/utils';

type QuizResultProps = {
  result: QuizResultData;
};

export function QuizResult({ result }: QuizResultProps) {
  if (!result.module) return null;

  return (
    <div className="mx-auto mt-8 max-w-4xl space-y-6">
      <SectionCard className="text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-cream text-gold shadow-card">
          <Star className="h-12 w-12 fill-current" />
        </div>
        <p className="mt-6 text-sm font-semibold text-muted-foreground">Kuis Selesai!</p>
        <h2 className="mt-2 text-6xl font-extrabold text-primary">
          {result.score} <span className="text-2xl text-muted-foreground">/ 100</span>
        </h2>
        <p
          className={cn(
            'mx-auto mt-4 max-w-xl rounded-2xl px-4 py-3 text-sm font-semibold',
            result.passed ? 'bg-mint text-primary' : 'bg-cream text-gold',
          )}
        >
          {result.passed
            ? 'Bagus! Kamu sudah memahami materi dengan baik.'
            : 'Tetap semangat. Pelajari ulang materi lalu coba lagi.'}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <ResultMetric label="Jawaban Benar" value={result.correctAnswers} />
          <ResultMetric label="Jawaban Salah" value={result.wrongAnswers} tone="danger" />
          <ResultMetric label="Total Pertanyaan" value={result.totalQuestions} />
          <ResultMetric label="Durasi" value={formatDuration(result.elapsedSeconds)} />
        </div>
        {result.bestScore !== null && result.bestScore !== result.score && (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            Nilai terbaik kamu: <span className="text-primary">{result.bestScore}/100</span>
          </p>
        )}

        <ProgressBar value={result.score} label="Performa Kamu" showValue className="mt-8" />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild>
            <a href="#pembahasan">
              <ClipboardList className="h-4 w-4" />
              Lihat Pembahasan
            </a>
          </Button>
          {!result.passed && (
            <Button asChild variant="outline">
              <Link href={`/student/modules/${result.module.id}/quiz`}>
                <RotateCcw className="h-4 w-4" />
                Ulangi Kuis
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/student/modules">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Modul
            </Link>
          </Button>
          <Button asChild variant="gold">
            <Link href={`/student/reflection?moduleId=${result.module.id}`}>
              <BookOpenCheck className="h-4 w-4" />
              Lanjut Refleksi
            </Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard id="pembahasan">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Pembahasan</p>
            <h3 className="text-xl font-extrabold text-ink">Review Jawaban</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {result.earnedPoints} dari {result.totalPoints} poin
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {result.reviewQuestions.map((question, index) => (
            <details key={question.id} className="rounded-2xl border border-border bg-white p-4 open:bg-mint/25">
              <summary className="cursor-pointer list-none font-bold text-ink">
                {index + 1}. {question.questionText}
              </summary>
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <AnswerLine label="Jawabanmu" value={formatAnswer(question.selectedAnswer, question.options)} />
                <AnswerLine label="Jawaban benar" value={formatAnswer(question.correctAnswer, question.options)} strong />
                {question.explanation && (
                  <p className="rounded-xl border border-gold/20 bg-cream px-4 py-3 text-ink">
                    {question.explanation}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </SectionCard>
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

function AnswerLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <span className="font-semibold text-muted-foreground sm:w-32">{label}</span>
      <span className={strong ? 'font-bold text-primary' : 'text-ink'}>{value || '-'}</span>
    </p>
  );
}

function formatAnswer(answer: string, options: { id: string; text: string }[]) {
  return answer
    .split('|')
    .filter(Boolean)
    .map((id) => options.find((option) => option.id === id)?.text ?? id)
    .join(', ');
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
