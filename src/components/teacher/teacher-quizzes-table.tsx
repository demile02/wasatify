'use client';

import { useMemo, useState } from 'react';
import { BarChart3, ClipboardCheck, Eye, FileQuestion, PencilLine, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import type { TeacherQuizListItem, TeacherQuizModuleOption, TeacherQuizStatus } from '@/lib/teacher/quizzes';
import { cn } from '@/lib/utils';

type TeacherQuizzesTableProps = {
  quizzes: TeacherQuizListItem[];
  modules: TeacherQuizModuleOption[];
};

type StatusFilter = 'all' | TeacherQuizStatus;

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Diarsipkan' },
];

export function TeacherQuizzesTable({ quizzes, modules }: TeacherQuizzesTableProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [moduleId, setModuleId] = useState('all');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      const matchesQuery =
        !normalizedQuery ||
        quiz.title.toLowerCase().includes(normalizedQuery) ||
        quiz.moduleTitle.toLowerCase().includes(normalizedQuery) ||
        (quiz.description?.toLowerCase().includes(normalizedQuery) ?? false);
      const matchesStatus = status === 'all' || quiz.status === status || (status === 'published' && quiz.isPublished);
      const matchesModule = moduleId === 'all' || quiz.moduleId === moduleId;

      return matchesQuery && matchesStatus && matchesModule;
    });
  }, [moduleId, query, quizzes, status]);
  const publishedCount = quizzes.filter((quiz) => quiz.isPublished || quiz.status === 'published').length;
  const attemptsCount = quizzes.reduce((total, quiz) => total + quiz.attemptCount, 0);
  const scoredQuizzes = quizzes.filter((quiz) => typeof quiz.averageScore === 'number');
  const overallAverage = scoredQuizzes.length
    ? Math.round(scoredQuizzes.reduce((total, quiz) => total + Number(quiz.averageScore), 0) / scoredQuizzes.length)
    : null;

  if (!quizzes.length) {
    return (
      <EmptyState
        className="mt-8"
        icon={ClipboardCheck}
        title="Belum ada kuis"
        description="Kuis yang dibuat di editor modul akan tampil di pusat kuis guru."
        action={
          <Button asChild>
            <Link href="/teacher/modules/new">
              <Plus className="h-4 w-4" />
              Buat Kuis
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Kuis" value={quizzes.length} description="Kuis dari modul Anda" icon={ClipboardCheck} />
        <StatCard label="Published" value={publishedCount} description="Siap dikerjakan siswa" icon={Eye} tone="mint" />
        <StatCard label="Attempt" value={attemptsCount} description="Percobaan siswa tercatat" icon={FileQuestion} tone="gold" />
        <StatCard label="Rata-rata Skor" value={overallAverage ?? '-'} description="Rata-rata kuis bernilai" icon={BarChart3} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kuis atau modul..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <select
          value={moduleId}
          onChange={(event) => setModuleId(event.target.value)}
          className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option value="all">Semua Modul</option>
          {modules.map((moduleItem) => (
            <option key={moduleItem.id} value={moduleItem.id}>
              {moduleItem.title}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {statusFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {filteredQuizzes.length ? (
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => (
            <SectionCard key={quiz.id} className="overflow-hidden p-0">
              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <QuizStatusBadge status={quiz.isPublished ? 'published' : quiz.status} />
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      Modul: {getStatusLabel(quiz.moduleStatus)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold text-ink">{quiz.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-primary">{quiz.moduleTitle}</p>
                  {quiz.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{quiz.description}</p>}
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/teacher/modules/${quiz.moduleId}/preview`}>
                      <Eye className="h-4 w-4" />
                      Preview
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/teacher/modules/${quiz.moduleId}/edit?step=quiz`}>
                      <PencilLine className="h-4 w-4" />
                      Edit Kuis
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 border-t border-border bg-slate-50/60 p-5 sm:grid-cols-2 xl:grid-cols-7">
                <Metric label="Pertanyaan" value={quiz.questionCount} />
                <Metric label="Nilai Kelulusan" value={quiz.passingGrade} />
                <Metric label="Kesempatan" value={quiz.maxAttempts} />
                <Metric label="Retake" value={quiz.allowRetake ? 'Ya' : 'Tidak'} />
                <Metric label="Attempt" value={quiz.attemptCount} />
                <Metric label="Rata-rata" value={quiz.averageScore ?? '-'} />
                <Metric label="Nilai Terbaik" value={quiz.bestScore ?? '-'} />
              </div>

              <div className="border-t border-border p-5">
                <button
                  type="button"
                  onClick={() => setExpandedQuizId((current) => (current === quiz.id ? null : quiz.id))}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {expandedQuizId === quiz.id ? 'Tutup hasil' : 'Lihat attempts/results'}
                </button>

                {expandedQuizId === quiz.id && <QuizAttemptsTable quiz={quiz} />}
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={Search}
          title="Kuis tidak ditemukan"
          description="Coba ubah kata kunci, modul, atau filter status."
        />
      )}
    </div>
  );
}

function getStatusLabel(status: TeacherQuizStatus) {
  if (status === 'published') return 'Published';
  if (status === 'draft') return 'Draft';
  return 'Diarsipkan';
}

function QuizAttemptsTable({ quiz }: { quiz: TeacherQuizListItem }) {
  if (!quiz.attempts.length) {
    return (
      <EmptyState
        className="mt-4 min-h-48"
        icon={FileQuestion}
        title="Belum ada attempt"
        description="Hasil siswa akan tampil setelah kuis dikerjakan."
      />
    );
  }

  return (
    <div className="mt-4 max-w-full overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-bold">Siswa</th>
            <th className="px-4 py-3 font-bold">Skor</th>
            <th className="px-4 py-3 font-bold">Status</th>
            <th className="px-4 py-3 font-bold">Dikirim</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {quiz.attempts.map((attempt) => (
            <tr key={attempt.id}>
              <td className="px-4 py-3">
                <p className="font-bold text-ink">{attempt.studentName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{attempt.studentEmail ?? '-'}</p>
              </td>
              <td className="px-4 py-3 font-semibold text-foreground">{attempt.score ?? '-'}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-bold',
                    attempt.passed ? 'border-primary/15 bg-mint text-primary' : 'border-red-200 bg-red-50 text-red-700',
                  )}
                >
                  {attempt.passed ? 'Lulus' : 'Belum lulus'}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {attempt.submittedAt ? formatDateTime(attempt.submittedAt) : attempt.createdAt ? formatDateTime(attempt.createdAt) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-ink">{value}</p>
    </div>
  );
}

function QuizStatusBadge({ status }: { status: TeacherQuizStatus }) {
  const meta = {
    published: {
      label: 'Published',
      className: 'border-primary/15 bg-mint text-primary',
    },
    draft: {
      label: 'Draft',
      className: 'border-gold/20 bg-cream text-gold',
    },
    archived: {
      label: 'Diarsipkan',
      className: 'border-slate-200 bg-slate-100 text-slate-600',
    },
  }[status];

  return <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', meta.className)}>{meta.label}</span>;
}
