'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileImage, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { InfographicViewer } from '@/components/student/infographic-viewer';
import { Button } from '@/components/ui/button';
import { markLessonCompleteAction } from '@/lib/student/actions';
import type { StudentLesson } from '@/lib/student/learning';
import type { StudentModule } from '@/lib/demo/student';
import { cn } from '@/lib/utils';

type LessonViewerProps = {
  moduleItem: StudentModule;
  lessons: StudentLesson[];
  completedLessonIds: string[];
};

type LessonTab = 'material' | 'video' | 'infographic';

const tabs: { value: LessonTab; label: string }[] = [
  { value: 'material', label: 'Materi' },
  { value: 'video', label: 'Video' },
  { value: 'infographic', label: 'Infografik' },
];

export function LessonViewer({ moduleItem, lessons, completedLessonIds }: LessonViewerProps) {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<LessonTab>('material');
  const [completedIds, setCompletedIds] = useState(() => new Set(completedLessonIds));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeLesson = lessons[activeLessonIndex];
  const completedPercent = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;
  const isCompleted = activeLesson ? completedIds.has(activeLesson.id) : false;

  const materialParagraphs = useMemo(() => {
    if (!activeLesson?.content) return [];
    return activeLesson.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [activeLesson?.content]);

  if (!lessons.length || !activeLesson) {
    return (
      <SectionCard>
        <EmptyState
          title="Materi belum tersedia"
          description="Modul ini belum memiliki lesson published. Materi akan tampil otomatis setelah guru menambahkan konten."
        />
      </SectionCard>
    );
  }

  const canGoPrevious = activeLessonIndex > 0;
  const canGoNext = activeLessonIndex < lessons.length - 1;

  function markComplete() {
    if (!activeLesson || completedIds.has(activeLesson.id)) return;
    setFeedback(null);

    startTransition(async () => {
      const result = await markLessonCompleteAction(moduleItem.id, activeLesson.id);

      if (!result.ok) {
        setFeedback(result.error ?? 'Progress belum berhasil disimpan.');
        return;
      }

      setCompletedIds((current) => {
        const next = new Set(current);
        next.add(activeLesson.id);
        return next;
      });
      setFeedback('Progress materi tersimpan.');
    });
  }

  function goToLesson(nextIndex: number) {
    setActiveLessonIndex(nextIndex);
    setActiveTab('material');
    setFeedback(null);
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_0.38fr]">
      <SectionCard className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
              <Link href="/student/modules">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Modul
              </Link>
            </Button>
            <p className="text-sm font-bold text-primary">{moduleItem.title}</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">{activeLesson.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pelajaran {activeLessonIndex + 1} dari {lessons.length} - {activeLesson.estimatedMinutes} menit
            </p>
          </div>
          <div className="min-w-40">
            <ProgressBar value={completedPercent} label="Progress Materi" showValue />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-xl border border-border bg-slate-50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-bold transition',
                activeTab === tab.value ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 min-h-80">
          {activeTab === 'material' && (
            <div className="app-readable rounded-2xl bg-mint/45 p-5 sm:p-6">
              {materialParagraphs.length ? (
                <div className="space-y-5 text-base leading-8 text-muted-foreground">
                  {materialParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Konten materi belum diisi"
                  description="Lesson ini sudah tersedia, tetapi isi materinya masih kosong."
                />
              )}
            </div>
          )}

          {activeTab === 'video' && (
            <MediaPanel
              url={activeLesson.videoUrl}
              type="video"
              emptyTitle="Video belum tersedia"
              emptyDescription="Guru belum menambahkan video untuk lesson ini."
            />
          )}

          {activeTab === 'infographic' && (
            <MediaPanel
              url={activeLesson.infographicUrl}
              infographicAsset={activeLesson.infographicAsset}
              type="image"
              emptyTitle="Infografik belum tersedia"
              emptyDescription="Guru belum menambahkan infografik untuk lesson ini."
            />
          )}
        </div>

        {feedback && (
          <div className="mt-5 rounded-xl border border-primary/15 bg-mint px-4 py-3 text-sm font-semibold text-primary">
            {feedback}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={!canGoPrevious}
            onClick={() => goToLesson(activeLessonIndex - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant={isCompleted ? 'secondary' : 'default'} onClick={markComplete} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {isCompleted ? 'Materi Selesai' : isPending ? 'Menyimpan...' : 'Tandai Selesai'}
            </Button>
            {canGoNext ? (
              <Button type="button" onClick={() => goToLesson(activeLessonIndex + 1)}>
                Selanjutnya <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/student/modules/${moduleItem.id}/quiz`}>
                  Mulai Kuis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      <div className="space-y-5">
        <SectionCard>
          <p className="font-bold text-ink">Daftar Pelajaran</p>
          <div className="mt-4 space-y-3">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => goToLesson(index)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition',
                  activeLesson.id === lesson.id
                    ? 'border-primary bg-mint text-primary'
                    : 'border-border bg-white text-foreground hover:border-primary/35',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg font-bold',
                    completedIds.has(lesson.id) ? 'bg-primary text-white' : 'bg-slate-100 text-muted-foreground',
                  )}
                >
                  {completedIds.has(lesson.id) ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <span className="flex-1 font-semibold">{lesson.title}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard variant="muted">
          <p className="font-bold text-ink">Selesaikan Alur</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Baca materi, tandai lesson selesai, lalu lanjutkan ke kuis untuk menyimpan hasil dan membuka modul berikutnya.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link href={`/student/modules/${moduleItem.id}/quiz`}>Buka Kuis</Link>
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}

function MediaPanel({
  url,
  infographicAsset,
  type,
  emptyTitle,
  emptyDescription,
}: {
  url: string | null;
  infographicAsset?: StudentLesson['infographicAsset'];
  type: 'video' | 'image';
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (type === 'image' && infographicAsset) {
    return <InfographicViewer asset={infographicAsset} />;
  }

  if (!url) {
    return (
      <EmptyState
        icon={type === 'video' ? PlayCircle : FileImage}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  if (type === 'video') {
    return (
      <div className="aspect-video w-full max-w-full overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-card">
        <video src={url} controls className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URLs are user content and are displayed unoptimized here. */}
      <img src={url} alt="Infografik lesson" className="max-h-[520px] w-full object-contain" />
    </div>
  );
}
