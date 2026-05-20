import Link from 'next/link';
import { ArrowLeft, BookOpen, ClipboardCheck, FileQuestion, ImageIcon, PlayCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getModuleEditorData, type ModuleEditorInitialData } from '@/lib/teacher/module-editor';
import { cn } from '@/lib/utils';

type TeacherModulePreviewPageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function TeacherModulePreviewPage({ params }: TeacherModulePreviewPageProps) {
  const [{ moduleId }, profile] = await Promise.all([params, requireTeacher()]);
  const teacherProfile = profile ?? demoTeacherProfile;
  const editorData = await getModuleEditorData(teacherProfile, decodeURIComponent(moduleId));

  if (!editorData.module) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Modul tidak ditemukan"
        description="Modul yang Anda cari belum tersedia atau tidak dapat diakses."
        action={
          <Button asChild>
            <Link href="/teacher/modules">Kembali ke Modul</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Preview Modul"
        title={editorData.module.title}
        description="Tampilan read-only untuk memeriksa materi, lesson, kuis, dan infografik sebelum dibuka siswa."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/teacher/modules">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/teacher/modules/${editorData.module.id}/edit`}>Edit Modul</Link>
            </Button>
          </div>
        }
      />

      <ModulePreview module={editorData.module} />
    </div>
  );
}

function ModulePreview({ module }: { module: ModuleEditorInitialData }) {
  const filledLessons = module.lessons.filter((lesson) => lesson.title.trim() || lesson.content.trim());
  const filledQuestions = module.quiz.questions.filter((question) => question.questionText.trim());

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.42fr]">
      <div className="space-y-6">
        <SectionCard className="overflow-hidden p-0">
          <div
            className={cn(
              'grid min-h-64 place-items-center bg-mint text-primary',
              module.coverImagePath ? 'bg-cover bg-center' : '',
            )}
            style={module.coverImagePath ? { backgroundImage: `url(${module.coverImagePath})` } : undefined}
          >
            {!module.coverImagePath && <BookOpen className="h-16 w-16" />}
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={module.status} />
              {module.difficulty && <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-gold">{module.difficulty}</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{module.estimatedMinutes} menit</span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-ink">{module.title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{module.description}</p>
            {module.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {module.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-white px-3 py-1 text-xs font-bold text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <p className="font-bold text-ink">Lessons</p>
          </div>
          {filledLessons.length ? (
            <div className="mt-5 space-y-4">
              {filledLessons.map((lesson, index) => (
                <div key={lesson.id ?? `${lesson.title}-${index}`} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-primary">Lesson {index + 1}</p>
                      <h3 className="mt-1 text-lg font-extrabold text-ink">{lesson.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      {lesson.videoUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mint px-3 py-1 text-primary">
                          <PlayCircle className="h-3.5 w-3.5" />
                          Video
                        </span>
                      )}
                      {(lesson.infographicUrl || lesson.infographicAssetId) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-gold">
                          <ImageIcon className="h-3.5 w-3.5" />
                          Infografik
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {lesson.content || 'Konten lesson belum diisi.'}
                  </p>
                  {lesson.reflectionPrompt && (
                    <div className="mt-4 rounded-2xl border border-primary/10 bg-mint/40 p-4 text-sm text-foreground">
                      <span className="font-bold text-primary">Renungkan: </span>
                      {lesson.reflectionPrompt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5"
              icon={BookOpen}
              title="Belum ada lesson"
              description="Lesson yang dibuat guru akan tampil di preview ini."
            />
          )}
        </SectionCard>
      </div>

      <div className="space-y-6">
        <SectionCard>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <p className="font-bold text-ink">Ringkasan Kuis</p>
          </div>
          <div className="mt-5 space-y-4 text-sm">
            <PreviewMetric label="Judul" value={module.quiz.title || 'Kuis Pemahaman'} />
            <PreviewMetric label="Nilai Kelulusan" value={`${module.quiz.passingScore}`} />
            <PreviewMetric label="Jumlah Kesempatan" value={`${module.quiz.maxAttempts}`} />
            <PreviewMetric label="Pertanyaan" value={`${filledQuestions.length}`} />
            <PreviewMetric label="Status" value={module.quiz.isPublished || module.quiz.status === 'published' ? 'Dipublikasikan' : 'Draft'} />
          </div>
          {filledQuestions.length ? (
            <div className="mt-5 space-y-3">
              {filledQuestions.slice(0, 5).map((question, index) => (
                <div key={question.id ?? `${question.questionText}-${index}`} className="rounded-2xl border border-border bg-white p-3">
                  <p className="text-xs font-bold text-primary">Pertanyaan {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{question.questionText}</p>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard>
          <p className="font-bold text-ink">Infografik</p>
          <div className="mt-4 space-y-3">
            {filledLessons.some((lesson) => lesson.infographicUrl || lesson.infographicAssetId) ? (
              filledLessons
                .filter((lesson) => lesson.infographicUrl || lesson.infographicAssetId)
                .map((lesson, index) => (
                  <div key={lesson.id ?? `${lesson.title}-infographic-${index}`} className="rounded-2xl border border-border bg-white p-4">
                    <p className="font-bold text-ink">{lesson.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lesson.infographicStatus === 'ready'
                        ? `${lesson.infographicSlideCount ?? 0} slide siap ditampilkan`
                        : lesson.infographicStatus === 'failed'
                          ? lesson.infographicError ?? 'Infografik gagal diproses.'
                          : lesson.infographicStatus
                            ? 'Infografik sedang diproses.'
                            : 'Infografik berupa URL/file mentah.'}
                    </p>
                  </div>
                ))
            ) : (
              <EmptyState
                className="min-h-48"
                icon={ImageIcon}
                title="Belum ada infografik"
                description="Infografik lesson akan tampil jika sudah ditambahkan."
              />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-bold text-ink">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ModuleEditorInitialData['status'] }) {
  const meta = {
    published: 'border-primary/15 bg-mint text-primary',
    draft: 'border-gold/20 bg-cream text-gold',
    archived: 'border-slate-200 bg-slate-100 text-slate-600',
  }[status];

  return (
    <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', meta)}>
      {status === 'published' ? 'Dipublikasikan' : status === 'draft' ? 'Draft' : 'Diarsipkan'}
    </span>
  );
}
