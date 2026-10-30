'use client';

import { toEmbeddableVideoUrl } from '@/lib/media/video-url';

import { useAsyncAction } from '@/hooks/use-async-action';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileImage,
  Lightbulb,
  PlayCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { InfographicViewer } from '@/components/student/infographic-viewer';
import { InfographicImage } from '@/components/student/infographic-image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { markLessonCompleteAction } from '@/lib/student/actions';
import type { StudentLesson } from '@/lib/student/learning';
import type { StudentModule } from '@/lib/demo/student';
import { cn } from '@/lib/utils';

type LessonReaderProps = {
  moduleItem: StudentModule;
  lessons: StudentLesson[];
  completedLessonIds: string[];
  basePath?: string;
  quizHref?: string | null;
  onCompleteLesson?: (lessonId: string) => boolean | void | Promise<boolean | void>;
};

type LessonTab = 'material' | 'video' | 'infographic';

const tabs: { value: LessonTab; label: string }[] = [
  { value: 'material', label: 'Materi' },
  { value: 'video', label: 'Video' },
  { value: 'infographic', label: 'Infografik' },
];

export function LessonReader({ moduleItem, lessons, completedLessonIds, basePath = '/student', quizHref, onCompleteLesson }: LessonReaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [completedIds, setCompletedIds] = useState(() => new Set(completedLessonIds));
  const [progressPercent, setProgressPercent] = useState(moduleItem.progress);
  const [isPending, runAction] = useAsyncAction();

  const activeLessonId = searchParams?.get('lesson') ?? null;
  const activeLessonIndex = Math.max(
    lessons.findIndex((lesson) => lesson.id === activeLessonId || lesson.slug === activeLessonId),
    0,
  );
  const activeLesson = lessons[activeLessonIndex];
  const completedPercent = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : progressPercent;

  const materialParagraphs = useMemo(() => {
    if (!activeLesson?.content) return [];
    return activeLesson.content
      .split(/\n{2,}/)
      .flatMap((paragraph) => paragraph.split(/(?<=\.)\s+(?=[A-Z0-9"'(])/))
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [activeLesson?.content]);

  const keyPoints = useMemo(() => {
    if (activeLesson?.keyPoints !== null && activeLesson?.keyPoints !== undefined) {
      return activeLesson.keyPoints.map((point) => point.trim()).filter(Boolean);
    }

    return materialParagraphs.length > 1 ? materialParagraphs.slice(0, 3) : [];
  }, [activeLesson?.keyPoints, materialParagraphs]);

  if (!lessons.length || !activeLesson) {
    return (
      <SectionCard>
        <EmptyState
          icon={BookOpen}
          title="Materi belum tersedia"
          description="Modul ini belum memiliki pelajaran yang diterbitkan. Materi akan tampil setelah guru menambahkan konten."
        />
      </SectionCard>
    );
  }

  const isCompleted = completedIds.has(activeLesson.id);
  const canGoPrevious = activeLessonIndex > 0;
  const canGoNext = activeLessonIndex < lessons.length - 1;
  const isLastLessonCompleted = !canGoNext && isCompleted;
  const nextQuizHref = quizHref === undefined ? `${basePath}/modules/${moduleItem.id}/quiz` : quizHref;

  function navigateToLesson(index: number) {
    const nextLesson = lessons[index];
    if (!nextLesson) return;

    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('lesson', nextLesson.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function markComplete() {
    if (!activeLesson || completedIds.has(activeLesson.id)) return true;

    if (onCompleteLesson) {
      const saved = await onCompleteLesson(activeLesson.id);
      if (saved === false) return false;

      setCompletedIds((current) => new Set(current).add(activeLesson.id));
      setProgressPercent(Math.round(((completedIds.size + 1) / lessons.length) * 100));
      toast.success('Progress pelajaran tersimpan di browser ini.');
      return true;
    }

    const result = await markLessonCompleteAction(moduleItem.id, activeLesson.id);

    if (!result.ok) {
      toast.error(result.error ?? 'Progress materi belum berhasil disimpan.');
      return false;
    }

    setCompletedIds((current) => {
      const next = new Set(current);
      next.add(activeLesson.id);
      return next;
    });
    setProgressPercent(result.progressPercent ?? Math.round(((completedIds.size + 1) / lessons.length) * 100));
    toast.success('Progress pelajaran tersimpan.');
    return true;
  }

  function handleMarkComplete() {
    runAction(async () => {
      await markComplete();
      router.refresh();
    });
  }

  function handleNext() {
    runAction(async () => {
      const saved = await markComplete();
      if (saved && canGoNext) navigateToLesson(activeLessonIndex + 1);
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 space-y-6">
      <SectionCard className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink">Daftar Pelajaran</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {completedIds.size} dari {lessons.length} selesai
            </p>
          </div>
          <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">{completedPercent}%</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson, index) => (
            <LessonNavButton
              key={lesson.id}
              lesson={lesson}
              index={index}
              active={activeLesson.id === lesson.id}
              completed={completedIds.has(lesson.id)}
              onClick={() => navigateToLesson(index)}
            />
          ))}
        </div>

      </SectionCard>

      <SectionCard className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">{moduleItem.title}</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">{activeLesson.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pelajaran {activeLessonIndex + 1} dari {lessons.length} - {activeLesson.estimatedMinutes} menit
            </p>
          </div>
          <ProgressBar value={progressPercent || completedPercent} label="Progress Modul" showValue className="lg:w-72" />
        </div>

        <Tabs defaultValue="material" className="mt-5">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-slate-50 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl py-2 font-bold data-[state=active]:bg-white data-[state=active]:text-primary"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="material" className="mt-6">
            <MaterialPanel
              paragraphs={materialParagraphs}
              reflectionPrompt={activeLesson.reflectionPrompt}
              keyPoints={keyPoints}
            />
          </TabsContent>

          <TabsContent value="video" className="mt-6">
            <MediaPanel
              url={activeLesson.videoUrl}
              type="video"
              emptyTitle="Video belum tersedia untuk materi ini."
              emptyDescription="Guru belum menambahkan video pendukung pada pelajaran ini."
            />
          </TabsContent>

          <TabsContent value="infographic" className="mt-6">
            <MediaPanel
              url={activeLesson.infographicUrl}
              infographicAsset={activeLesson.infographicAsset}
              type="image"
              emptyTitle="Infografik belum tersedia untuk materi ini."
              emptyDescription="Guru belum menambahkan infografik pendukung pada pelajaran ini."
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={!canGoPrevious || isPending}
            onClick={() => navigateToLesson(activeLessonIndex - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant={isCompleted ? 'secondary' : 'default'}
              onClick={handleMarkComplete}
              disabled={isPending || isCompleted}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCompleted ? 'Selesai' : isPending ? 'Menyimpan...' : 'Tandai Selesai'}
            </Button>

            {canGoNext ? (
              <Button type="button" onClick={handleNext} disabled={isPending}>
                Selanjutnya <ArrowRight className="h-4 w-4" />
              </Button>
            ) : isLastLessonCompleted && nextQuizHref ? (
              <Button asChild>
                <Link href={nextQuizHref}>
                  Lanjut ke Kuis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button type="button" disabled title={nextQuizHref ? undefined : 'Kuis belum tersedia untuk modul ini.'}>
                {nextQuizHref ? 'Lanjut ke Kuis' : 'Kuis belum tersedia'} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function LessonNavButton({
  lesson,
  index,
  active,
  completed,
  onClick,
}: {
  lesson: StudentLesson;
  index: number;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition',
        active ? 'border-primary bg-mint text-primary' : 'border-border bg-white text-foreground hover:border-primary/35',
      )}
    >
      <LessonNumber completed={completed} index={index} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-semibold">{lesson.title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{lesson.estimatedMinutes} menit</span>
      </span>
    </button>
  );
}

function LessonNumber({ completed, index }: { completed: boolean; index: number }) {
  return (
    <span
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold',
        completed ? 'bg-primary text-white' : 'bg-slate-100 text-muted-foreground',
      )}
    >
      {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
    </span>
  );
}

function MaterialPanel({
  paragraphs,
  reflectionPrompt,
  keyPoints,
}: {
  paragraphs: string[];
  reflectionPrompt: string | null;
  keyPoints: string[];
}) {
  if (!paragraphs.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Konten materi belum diisi"
        description="Pelajaran ini sudah tersedia, tetapi isi materinya masih kosong."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="app-readable rounded-2xl bg-mint/45 p-5 sm:p-6">
        <div className="space-y-5 text-base leading-8 text-ink">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      {keyPoints.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="font-bold text-ink">Poin Penting</p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-ink">
            {keyPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reflectionPrompt && (
        <div className="rounded-2xl border border-gold/25 bg-cream px-5 py-4">
          <div className="flex gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-bold text-ink">Renungkan</p>
              <p className="app-readable mt-1 text-sm leading-6 text-muted-foreground">{reflectionPrompt}</p>
            </div>
          </div>
        </div>
      )}
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
    const embedUrl = toEmbeddableVideoUrl(url);

    return (
      <div className="aspect-video w-full max-w-full overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-card">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Video pelajaran"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
            allowFullScreen
          />
        ) : (
          <video src={url} preload="metadata" controls className="h-full w-full object-contain" />
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <InfographicImage src={url} alt="Infografik pelajaran" />
    </div>
  );
}
