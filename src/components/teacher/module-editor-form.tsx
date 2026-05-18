'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileImage,
  ImageUp,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { saveTeacherModuleAction, type UploadedAssetInput } from '@/lib/teacher/module-actions';
import type {
  ModuleEditorInitialData,
  ModuleEditorLesson,
  ModuleEditorQuestion,
  TeacherClassOption,
} from '@/lib/teacher/module-editor';
import { cn } from '@/lib/utils';

type ModuleEditorFormProps = {
  mode: 'create' | 'edit';
  initialData: ModuleEditorInitialData;
  classes: TeacherClassOption[];
};

type LessonState = ModuleEditorLesson & {
  clientId: string;
  infographicFile?: File;
};

type QuestionState = ModuleEditorQuestion & {
  clientId: string;
};

type FormState = Omit<ModuleEditorInitialData, 'lessons' | 'quiz'> & {
  lessons: LessonState[];
  quiz: Omit<ModuleEditorInitialData['quiz'], 'questions'> & {
    questions: QuestionState[];
  };
};

type LocalModuleDraft = {
  form: FormState;
  tagsText: string;
  coverPreview: string;
  notification: NotificationState;
  savedAt: string;
};

type StepId = 'info' | 'content' | 'quiz' | 'summary';
type NotificationState = {
  enabled: boolean;
  message: string;
};

const steps: { id: StepId; label: string }[] = [
  { id: 'info', label: 'Informasi' },
  { id: 'content', label: 'Konten' },
  { id: 'quiz', label: 'Kuis' },
  { id: 'summary', label: 'Ringkasan' },
];

const optionIds = ['a', 'b', 'c', 'd'] as const;
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const PPTX_UNSUPPORTED_MESSAGE =
  'File PPTX belum dapat dikonversi otomatis di server saat ini. Ekspor PPTX ke PDF terlebih dahulu agar dapat ditampilkan sebagai slide.';
const PPTX_FAILED_MESSAGE = 'Konversi PPTX membutuhkan worker/server renderer. Gunakan PDF untuk saat ini.';

export function ModuleEditorForm({ mode, initialData, classes }: ModuleEditorFormProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<StepId>('info');
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(initialData.coverImagePath);
  const [tagsText, setTagsText] = useState(initialData.tags.join(', '));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingIntent, setSavingIntent] = useState<'draft' | 'publish' | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    enabled: mode === 'create',
    message: '',
  });
  const draftStorageKey = `wasatify:module-editor:${mode}:${initialData.id ?? 'new'}`;
  const restoredDraftRef = useRef(false);

  const activeStepIndex = steps.findIndex((step) => step.id === activeStep);
  const filledLessons = form.lessons.filter((lesson) => lesson.title.trim());
  const filledQuestions = form.quiz.questions.filter((question) => question.questionText.trim());
  const progressValue = Math.round(((activeStepIndex + 1) / steps.length) * 100);

  const selectedClass = useMemo(
    () => classes.find((classItem) => classItem.id === form.classId),
    [classes, form.classId],
  );

  useEffect(() => {
    if (restoredDraftRef.current) return;
    restoredDraftRef.current = true;

    try {
      const rawDraft = window.localStorage.getItem(draftStorageKey);
      if (!rawDraft) return;

      const parsedDraft = JSON.parse(rawDraft) as LocalModuleDraft;
      if (!parsedDraft?.form) return;

      setForm(toRestoredFormState(parsedDraft.form));
      setTagsText(parsedDraft.tagsText ?? '');
      setCoverPreview(parsedDraft.coverPreview ?? parsedDraft.form.coverImagePath ?? '');
      setNotification(parsedDraft.notification ?? { enabled: mode === 'create', message: '' });
      setSuccess(
        `Draft lokal dipulihkan${
          parsedDraft.savedAt ? ` dari ${formatDraftDate(parsedDraft.savedAt)}` : ''
        }. File upload perlu dipilih ulang jika belum tersimpan.`,
      );
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, mode]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const draft: LocalModuleDraft = {
          form: stripFormFiles(form),
          tagsText,
          coverPreview,
          notification,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      } catch {
        // Local autosave is best-effort only. Server save remains the source of truth.
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [coverPreview, draftStorageKey, form, notification, tagsText]);

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

function updateTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: shouldAutoUpdateSlug(current) ? slugify(title) : current.slug,
    }));
}

function normalizeQuizPatch(
  currentQuiz: FormState['quiz'],
  quizPatch: Partial<FormState['quiz']>,
): FormState['quiz'] {
  const nextQuiz = { ...currentQuiz, ...quizPatch };
  const maxAttempts = Math.max(Math.round(Number(nextQuiz.maxAttempts) || 1), 1);

  return {
    ...nextQuiz,
    maxAttempts,
    allowRetake: maxAttempts > 1 ? nextQuiz.allowRetake : false,
  };
}

function updateLesson(clientId: string, patch: Partial<LessonState>) {
    setForm((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) => (lesson.clientId === clientId ? { ...lesson, ...patch } : lesson)),
    }));
  }

  function reorderLessons(clientId: string, direction: -1 | 1) {
    setForm((current) => ({
      ...current,
      lessons: reorderByClientId(current.lessons, clientId, direction),
    }));
  }

  function updateQuestion(clientId: string, patch: Partial<QuestionState>) {
    setForm((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        questions: current.quiz.questions.map((question) =>
          question.clientId === clientId ? { ...question, ...patch } : question,
        ),
      },
    }));
  }

  function updateQuestionOption(clientId: string, optionIndex: number, value: string) {
    setForm((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        questions: current.quiz.questions.map((question) => {
          if (question.clientId !== clientId) return question;
          const options = [...question.options] as QuestionState['options'];
          options[optionIndex] = value;
          return { ...question, options };
        }),
      },
    }));
  }

  function reorderQuestions(clientId: string, direction: -1 | 1) {
    setForm((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        questions: reorderByClientId(current.quiz.questions, clientId, direction),
      },
    }));
  }

  function goNext() {
    const nextStep = steps[activeStepIndex + 1];
    if (nextStep) setActiveStep(nextStep.id);
  }

  function goPrevious() {
    const previousStep = steps[activeStepIndex - 1];
    if (previousStep) setActiveStep(previousStep.id);
  }

  async function saveModule(intent: 'draft' | 'publish') {
    setError(null);
    setSuccess(null);
    setSavingIntent(intent);

    try {
      const validationError = validateForm(intent, form);
      if (validationError) {
        setError(validationError);
        if (intent === 'publish') toast.warning(validationError);
        setSavingIntent(null);
        return;
      }

      const uploadedCover = coverFile ? await uploadModuleFile(coverFile, 'module-covers', 'covers') : null;
      const lessonsWithUploads = await Promise.all(
        form.lessons.map(async (lesson) => {
          if (!lesson.infographicFile) return lesson;
          const infographic = await uploadInfographicFile(lesson.infographicFile, form.id);
          return {
            ...lesson,
            infographicUrl: infographic.sourceUrl,
            infographicAssetId: infographic.assetId,
            infographicStatus: infographic.status,
            infographicSlideCount: infographic.slideCount,
            infographicError: infographic.errorMessage,
          };
        }),
      );
      const result = await saveTeacherModuleAction({
        moduleId: form.id,
        title: form.title,
        slug: form.slug,
        description: form.description,
        classId: form.classId,
        estimatedMinutes: form.estimatedMinutes,
        orderIndex: form.orderIndex,
        difficulty: form.difficulty,
        tags: parseTags(tagsText),
        coverImagePath: uploadedCover?.publicUrl ?? form.coverImagePath,
        coverAsset: uploadedCover ?? undefined,
        status: form.status,
        isPublic: form.isPublic,
        lessons: lessonsWithUploads.map(stripLessonState),
        quiz: {
          ...form.quiz,
          questions: form.quiz.questions.map(stripQuestionState),
        },
        intent,
        notification: {
          enabled: intent === 'publish' && notification.enabled,
          message: notification.message,
          type: mode === 'create' ? 'publish' : form.quiz.questions.length ? 'quiz_update' : 'update',
        },
      });

      if (!result.ok) {
        setError(result.error ?? 'Modul belum berhasil disimpan.');
        setSavingIntent(null);
        return;
      }

      setSuccess(intent === 'publish' ? 'Modul berhasil dipublikasikan.' : 'Draft modul berhasil disimpan.');
      toast.success(intent === 'publish' ? 'Modul berhasil dipublikasikan.' : 'Draft modul berhasil disimpan.');
      window.localStorage.removeItem(draftStorageKey);
      if (intent === 'publish') {
        router.replace('/teacher/modules');
      } else if (result.moduleId && mode === 'create') {
        router.replace(`/teacher/modules/${result.moduleId}/edit`);
      } else {
        router.refresh();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan modul.');
    } finally {
      setSavingIntent(null);
    }
  }

  return (
    <div className="mt-8">
      <SectionCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
              <Link href="/teacher/modules">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Modul
              </Link>
            </Button>
            <p className="text-sm font-bold text-primary">{mode === 'create' ? 'Buat Modul Baru' : 'Edit Modul'}</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">
              {form.title || 'Modul Pembelajaran WASATIFY'}
            </h2>
          </div>
          <div className="min-w-56">
            <ProgressBar value={progressValue} label={`Step ${activeStepIndex + 1} dari ${steps.length}`} showValue />
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition',
                activeStep === step.id
                  ? 'border-primary bg-primary text-white shadow-card'
                  : index < activeStepIndex
                    ? 'border-primary/20 bg-mint text-primary'
                    : 'border-border bg-white text-muted-foreground hover:bg-mint/40 hover:text-primary',
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/18 text-xs">
                {index < activeStepIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              {step.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="mt-6">
        {activeStep === 'info' && (
          <InfoStep
            form={form}
            classes={classes}
            selectedClass={selectedClass}
            coverPreview={coverPreview}
            tagsText={tagsText}
            onTagsChange={setTagsText}
            onCoverChange={(file) => {
              setCoverFile(file);
              setCoverPreview(file ? URL.createObjectURL(file) : form.coverImagePath);
            }}
            updateForm={updateForm}
            updateTitle={updateTitle}
          />
        )}

        {activeStep === 'content' && (
          <ContentStep
            lessons={form.lessons}
            updateLesson={updateLesson}
            reorderLessons={reorderLessons}
            addLesson={() =>
              setForm((current) => ({
                ...current,
                lessons: [...current.lessons, createLessonState(getNextOrderIndex(current.lessons))],
              }))
            }
            removeLesson={(clientId) =>
              setForm((current) => ({
                ...current,
                lessons:
                  current.lessons.length > 1
                    ? renumberByOrder(current.lessons.filter((lesson) => lesson.clientId !== clientId))
                    : current.lessons,
              }))
            }
          />
        )}

        {activeStep === 'quiz' && (
          <QuizStep
            quiz={form.quiz}
            updateQuiz={(quizPatch) => setForm((current) => ({ ...current, quiz: normalizeQuizPatch(current.quiz, quizPatch) }))}
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            reorderQuestions={reorderQuestions}
            addQuestion={() =>
              setForm((current) => ({
                ...current,
                quiz: {
                  ...current.quiz,
                  questions: [...current.quiz.questions, createQuestionState(undefined, getNextOrderIndex(current.quiz.questions))],
                },
              }))
            }
            removeQuestion={(clientId) =>
              setForm((current) => ({
                ...current,
                quiz: {
                  ...current.quiz,
                  questions:
                    current.quiz.questions.length > 1
                      ? renumberByOrder(current.quiz.questions.filter((question) => question.clientId !== clientId))
                      : current.quiz.questions,
                },
              }))
            }
          />
        )}

        {activeStep === 'summary' && (
          <SummaryStep
            form={form}
            tags={parseTags(tagsText)}
            coverPreview={coverPreview}
            selectedClass={selectedClass}
            filledLessons={filledLessons.length}
            filledQuestions={filledQuestions.length}
            notification={notification}
            onNotificationChange={setNotification}
          />
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-primary/15 bg-mint px-4 py-3 text-sm font-semibold text-primary">
          {success}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" disabled={activeStepIndex === 0} onClick={goPrevious}>
          <ArrowLeft className="h-4 w-4" />
          Sebelumnya
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(savingIntent)}
            onClick={() => saveModule('draft')}
          >
            <Save className="h-4 w-4" />
            {savingIntent === 'draft' ? 'Menyimpan...' : 'Simpan Draft'}
          </Button>
          {activeStep === 'summary' ? (
            <Button type="button" disabled={Boolean(savingIntent)} onClick={() => saveModule('publish')}>
              <CheckCircle2 className="h-4 w-4" />
              {savingIntent === 'publish' ? 'Mempublikasikan...' : 'Publikasikan'}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Simpan & Lanjut
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoStep({
  form,
  classes,
  selectedClass,
  coverPreview,
  tagsText,
  onTagsChange,
  onCoverChange,
  updateForm,
  updateTitle,
}: {
  form: FormState;
  classes: TeacherClassOption[];
  selectedClass?: TeacherClassOption;
  coverPreview: string;
  tagsText: string;
  onTagsChange: (value: string) => void;
  onCoverChange: (file: File | null) => void;
  updateForm: (patch: Partial<FormState>) => void;
  updateTitle: (title: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
      <SectionCard>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Judul Modul" className="sm:col-span-2">
            <input
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="Contoh: Adab dalam Islam"
              className={inputClass}
            />
          </Field>
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(event) => updateForm({ slug: slugify(event.target.value) })}
              placeholder="adab-dalam-islam"
              className={inputClass}
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Slug digunakan untuk URL modul. Akan dibuat otomatis dari judul.
            </p>
          </Field>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(event) => updateForm({ difficulty: event.target.value as FormState['difficulty'] })}
              className={inputClass}
            >
              <option value="">Pilih difficulty</option>
              <option value="pemula">Pemula</option>
              <option value="menengah">Menengah</option>
              <option value="lanjut">Lanjut</option>
            </select>
          </Field>
          <Field label="Deskripsi Singkat" className="sm:col-span-2">
            <textarea
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
              placeholder="Tuliskan ringkasan modul..."
              className={cn(inputClass, 'min-h-28 resize-none py-3')}
            />
          </Field>
          <Field label="Kelas/Tingkat">
            <select
              value={form.classId}
              onChange={(event) => updateForm({ classId: event.target.value })}
              className={inputClass}
            >
              <option value="">Umum / Semua Siswa</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                  {classItem.gradeLevel ? ` - ${classItem.gradeLevel}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Durasi Belajar">
            <input
              type="number"
              min={1}
              value={form.estimatedMinutes}
              onChange={(event) => updateForm({ estimatedMinutes: Number(event.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Urutan Modul">
            <input
              type="number"
              min={1}
              value={form.orderIndex}
              readOnly
              className={inputClass}
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Diatur otomatis. Ubah urutan dari daftar modul dengan tombol Naik/Turun.
            </p>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) => updateForm({ status: event.target.value as FormState['status'] })}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Tag/Topik" className="sm:col-span-2">
            <input
              value={tagsText}
              onChange={(event) => onTagsChange(event.target.value)}
              placeholder="Pisahkan dengan koma, contoh: Akhlak, Adab, Sehari-hari"
              className={inputClass}
            />
          </Field>
          <Field label="Cover Image URL" className="sm:col-span-2">
            <input
              value={form.coverImagePath}
              onChange={(event) => updateForm({ coverImagePath: event.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>
          <Field label="Upload Cover Image" className="sm:col-span-2">
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-mint/35 px-4 py-6 text-center transition hover:bg-mint/55">
              <ImageUp className="h-8 w-8 text-primary" />
              <span className="mt-3 text-sm font-bold text-ink">Upload cover modul</span>
              <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP, maksimal sesuai policy bucket</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => onCoverChange(event.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 sm:col-span-2">
            <span>
              <span className="block font-bold text-ink">Publish / Active</span>
              <span className="mt-1 block text-sm text-muted-foreground">Aktifkan jika modul siap tampil untuk siswa.</span>
            </span>
            <input
              type="checkbox"
              checked={form.status === 'published'}
              onChange={(event) => updateForm({ status: event.target.checked ? 'published' : 'draft' })}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </div>
      </SectionCard>

      <ModulePreview form={form} coverPreview={coverPreview} selectedClass={selectedClass} tags={parseTags(tagsText)} />
    </div>
  );
}

function ContentStep({
  lessons,
  updateLesson,
  reorderLessons,
  addLesson,
  removeLesson,
}: {
  lessons: LessonState[];
  updateLesson: (clientId: string, patch: Partial<LessonState>) => void;
  reorderLessons: (clientId: string, direction: -1 | 1) => void;
  addLesson: () => void;
  removeLesson: (clientId: string) => void;
}) {
  function handleInfographicFileChange(clientId: string, file?: File) {
    if (!file) {
      updateLesson(clientId, { infographicFile: undefined });
      return;
    }

    if (isPptxFile(file)) {
      toast.warning(PPTX_UNSUPPORTED_MESSAGE);
      updateLesson(clientId, { infographicFile: undefined });
      return;
    }

    updateLesson(clientId, { infographicFile: file });
  }

  return (
    <SectionCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-ink">Konten Lesson</p>
          <p className="mt-1 text-sm text-muted-foreground">Tambah, edit, urutkan, dan lengkapi materi modul.</p>
        </div>
        <Button type="button" onClick={addLesson}>
          <Plus className="h-4 w-4" />
          Tambah Lesson
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {lessons.map((lesson, index) => (
          <div key={lesson.clientId} className="rounded-2xl border border-border bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-bold text-ink">Lesson {index + 1}</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderLessons(lesson.clientId, -1)} disabled={index === 0}>
                  Naik
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderLessons(lesson.clientId, 1)} disabled={index === lessons.length - 1}>
                  Turun
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => window.confirm('Hapus lesson ini?') && removeLesson(lesson.clientId)}>
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Judul Lesson">
                <input
                  value={lesson.title}
                  onChange={(event) => updateLesson(lesson.clientId, { title: event.target.value })}
                  className={inputClass}
                  placeholder="Contoh: Pengertian Tawazun"
                />
              </Field>
              <Field label="Urutan">
                <input
                  type="number"
                  min={1}
                  value={lesson.orderIndex}
                  readOnly
                  className={inputClass}
                />
              </Field>
              <Field label="Materi Content" className="sm:col-span-2">
                <textarea
                  value={lesson.content}
                  onChange={(event) => updateLesson(lesson.clientId, { content: event.target.value })}
                  className={cn(inputClass, 'min-h-40 resize-none py-3')}
                  placeholder="Tuliskan isi materi..."
                />
              </Field>
              <Field label="Video URL Optional">
                <input
                  value={lesson.videoUrl}
                  onChange={(event) => updateLesson(lesson.clientId, { videoUrl: event.target.value })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Infografik URL Optional">
                <input
                  value={lesson.infographicUrl}
                  onChange={(event) => updateLesson(lesson.clientId, { infographicUrl: event.target.value })}
                  className={inputClass}
                  placeholder="https://... atau upload PDF/gambar di bawah"
                />
                <InfographicStatus lesson={lesson} />
              </Field>
              <Field label="Reflection Prompt Optional" className="sm:col-span-2">
                <input
                  value={lesson.reflectionPrompt}
                  onChange={(event) => updateLesson(lesson.clientId, { reflectionPrompt: event.target.value })}
                  className={inputClass}
                  placeholder="Pertanyaan renungan untuk siswa..."
                />
              </Field>
              <Field label="Upload Infografik" className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/20 bg-mint/25 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-mint/45">
                  <FileImage className="h-5 w-5" />
                  {lesson.infographicFile ? lesson.infographicFile.name : 'Pilih file PDF atau gambar infografik'}
                  <input
                    type="file"
                    accept={`application/pdf,${PPTX_MIME},image/png,image/jpeg,image/webp,image/gif`}
                    className="sr-only"
                    onChange={(event) => {
                      handleInfographicFileChange(lesson.clientId, event.target.files?.[0]);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  PDF akan dikonversi menjadi slide. PPTX belum dapat dikonversi otomatis; ekspor ke PDF terlebih dahulu.
                </p>
              </Field>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function InfographicStatus({ lesson }: { lesson: LessonState }) {
  if (lesson.infographicFile) {
    return (
      <p className="mt-2 text-xs font-semibold text-gold">
        File baru akan diproses saat modul disimpan.
      </p>
    );
  }

  if (!lesson.infographicAssetId || !lesson.infographicStatus) return null;

  const label =
    lesson.infographicStatus === 'ready'
      ? `Ready - ${lesson.infographicSlideCount ?? 0} slide`
      : lesson.infographicStatus === 'failed'
        ? 'Failed'
        : lesson.infographicStatus === 'processing'
          ? 'Processing'
          : 'Pending';
  const errorMessage = normalizeInfographicError(lesson.infographicError);

  return (
    <p className={cn('mt-2 text-xs font-semibold', lesson.infographicStatus === 'failed' ? 'text-red-600' : 'text-primary')}>
      Status infografik: {label}
      {errorMessage ? ` - ${errorMessage}` : ''}
    </p>
  );
}

function QuizStep({
  quiz,
  updateQuiz,
  updateQuestion,
  updateQuestionOption,
  reorderQuestions,
  addQuestion,
  removeQuestion,
}: {
  quiz: FormState['quiz'];
  updateQuiz: (patch: Partial<FormState['quiz']>) => void;
  updateQuestion: (clientId: string, patch: Partial<QuestionState>) => void;
  updateQuestionOption: (clientId: string, optionIndex: number, value: string) => void;
  reorderQuestions: (clientId: string, direction: -1 | 1) => void;
  addQuestion: () => void;
  removeQuestion: (clientId: string) => void;
}) {
  const retakeDisabled = Math.max(Math.round(quiz.maxAttempts || 1), 1) <= 1;

  return (
    <SectionCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul Kuis">
          <input
            value={quiz.title}
            onChange={(event) => updateQuiz({ title: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Nilai Kelulusan">
          <input
            type="number"
            min={0}
            max={100}
            value={quiz.passingScore}
            onChange={(event) => updateQuiz({ passingScore: Number(event.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Jumlah Kesempatan">
          <input
            type="number"
            min={1}
            value={quiz.maxAttempts}
            onChange={(event) => updateQuiz({ maxAttempts: Number(event.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Time Limit Seconds">
          <input
            type="number"
            min={60}
            value={quiz.timeLimitSeconds}
            onChange={(event) => updateQuiz({ timeLimitSeconds: Number(event.target.value) })}
            className={inputClass}
          />
        </Field>
        <label className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
          <span>
            <span className="block font-bold text-ink">Izinkan Mengulang</span>
            {retakeDisabled && (
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                Retake hanya tersedia jika Jumlah Kesempatan lebih dari 1.
              </span>
            )}
          </span>
          <input
            type="checkbox"
            checked={!retakeDisabled && quiz.allowRetake}
            disabled={retakeDisabled}
            onChange={(event) => updateQuiz({ allowRetake: event.target.checked })}
            className="h-5 w-5 accent-primary disabled:cursor-not-allowed disabled:opacity-45"
          />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
          <span className="font-bold text-ink">Tampilkan Pembahasan</span>
          <input type="checkbox" checked={quiz.showExplanation} onChange={(event) => updateQuiz({ showExplanation: event.target.checked })} className="h-5 w-5 accent-primary" />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
          <span className="font-bold text-ink">Acak Pertanyaan</span>
          <input type="checkbox" checked={quiz.shuffleQuestions} onChange={(event) => updateQuiz({ shuffleQuestions: event.target.checked })} className="h-5 w-5 accent-primary" />
        </label>
        <Field label="Quiz Status">
          <select value={quiz.status} onChange={(event) => updateQuiz({ status: event.target.value as FormState['quiz']['status'], isPublished: event.target.value === 'published' })} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Deskripsi Kuis" className="sm:col-span-2">
          <textarea
            value={quiz.description}
            onChange={(event) => updateQuiz({ description: event.target.value })}
            className={cn(inputClass, 'min-h-24 resize-none py-3')}
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="font-bold text-ink">Pertanyaan Multiple Choice</p>
        <Button type="button" onClick={addQuestion}>
          <Plus className="h-4 w-4" />
          Tambah Pertanyaan
        </Button>
      </div>

      <div className="mt-5 space-y-5">
        {quiz.questions.map((question, index) => (
          <div key={question.clientId} className="rounded-2xl border border-border bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-bold text-ink">Pertanyaan {index + 1}</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderQuestions(question.clientId, -1)} disabled={index === 0}>
                  Naik
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderQuestions(question.clientId, 1)} disabled={index === quiz.questions.length - 1}>
                  Turun
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => window.confirm('Hapus pertanyaan ini?') && removeQuestion(question.clientId)}>
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <Field label="Question Text">
                <textarea
                  value={question.questionText}
                  onChange={(event) => updateQuestion(question.clientId, { questionText: event.target.value })}
                  className={cn(inputClass, 'min-h-24 resize-none py-3')}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Question Type">
                  <select
                    value={question.questionType}
                    onChange={(event) => {
                      const nextType = event.target.value as QuestionState['questionType'];
                      updateQuestion(question.clientId, {
                        questionType: nextType,
                        options: nextType === 'true_false' ? ['Benar', 'Salah', '', ''] : question.options,
                        correctAnswer: 'a',
                      });
                    }}
                    className={inputClass}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                  </select>
                </Field>
                <Field label="Urutan">
                  <input
                    type="number"
                    min={1}
                    value={question.orderIndex}
                    readOnly
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {optionIds.slice(0, question.questionType === 'true_false' ? 2 : 4).map((optionId, optionIndex) => (
                  <Field key={optionId} label={`Opsi ${optionId.toUpperCase()}`}>
                    <input
                      value={question.options[optionIndex]}
                      onChange={(event) => updateQuestionOption(question.clientId, optionIndex, event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Correct Answer">
                  <select
                    value={question.correctAnswer}
                    onChange={(event) =>
                      updateQuestion(question.clientId, {
                        correctAnswer: event.target.value as QuestionState['correctAnswer'],
                      })
                    }
                    className={inputClass}
                  >
                    {optionIds.map((optionId) => (
                      <option key={optionId} value={optionId}>
                        {optionId.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Points">
                  <input
                    type="number"
                    min={1}
                    value={question.points}
                    onChange={(event) => updateQuestion(question.clientId, { points: Number(event.target.value) })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Explanation">
                <textarea
                  value={question.explanation}
                  onChange={(event) => updateQuestion(question.clientId, { explanation: event.target.value })}
                  className={cn(inputClass, 'min-h-24 resize-none py-3')}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SummaryStep({
  form,
  tags,
  coverPreview,
  selectedClass,
  filledLessons,
  filledQuestions,
  notification,
  onNotificationChange,
}: {
  form: FormState;
  tags: string[];
  coverPreview: string;
  selectedClass?: TeacherClassOption;
  filledLessons: number;
  filledQuestions: number;
  notification: NotificationState;
  onNotificationChange: (value: NotificationState) => void;
}) {
  const defaultMessage = `Modul baru ${form.title || 'ini'} telah tersedia.`;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
      <SectionCard>
        <p className="font-bold text-ink">Preview Final</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SummaryMetric label="Judul" value={form.title || '-'} />
          <SummaryMetric label="Slug" value={form.slug || '-'} />
          <SummaryMetric label="Status" value={form.status === 'published' ? 'Aktif' : 'Draft'} />
          <SummaryMetric label="Kelas/Tingkat" value={selectedClass?.name ?? 'Umum'} />
          <SummaryMetric label="Durasi" value={`${form.estimatedMinutes || 0} menit`} />
          <SummaryMetric label="Lessons" value={`${filledLessons} lesson`} />
          <SummaryMetric label="Pertanyaan Kuis" value={`${filledQuestions} pertanyaan`} />
        </div>
        <div className="mt-5 grid gap-3">
          <ReadinessItem ready={form.title.trim().length >= 5 && form.description.trim().length >= 20} label="Informasi lengkap" />
          <ReadinessItem ready={filledLessons >= 1} label="Minimal 1 lesson" />
          <ReadinessItem ready={Boolean(form.quiz.title.trim())} label="Quiz tersedia" />
          <ReadinessItem ready={filledQuestions >= 1} label="Minimal 1 question" />
        </div>
        <div className="mt-5 rounded-2xl border border-primary/10 bg-mint/30 p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={notification.enabled}
              onChange={(event) => onNotificationChange({ ...notification, enabled: event.target.checked })}
              className="mt-1 h-5 w-5 accent-primary"
            />
            <span>
              <span className="block font-bold text-ink">Kirim pemberitahuan ke siswa</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                Jika aktif, siswa akan melihat pengumuman setelah modul dipublikasikan atau diperbarui.
              </span>
            </span>
          </label>
          <Field label="Kalimat pemberitahuan" className="mt-4 block">
            <textarea
              value={notification.message}
              onChange={(event) => onNotificationChange({ ...notification, message: event.target.value })}
              placeholder={defaultMessage}
              className={cn(inputClass, 'min-h-24 resize-none py-3')}
            />
          </Field>
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-white p-4">
          <p className="font-bold text-ink">Deskripsi</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.description || '-'}</p>
        </div>
      </SectionCard>

      <ModulePreview form={form} coverPreview={coverPreview} selectedClass={selectedClass} tags={tags} />
    </div>
  );
}

function ModulePreview({
  form,
  coverPreview,
  selectedClass,
  tags,
}: {
  form: FormState;
  coverPreview: string;
  selectedClass?: TeacherClassOption;
  tags: string[];
}) {
  return (
    <SectionCard variant="muted">
      <p className="font-bold text-ink">Preview Modul</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
        <div
          className="grid aspect-video place-items-center bg-mint text-primary"
          style={coverPreview ? { backgroundImage: `url(${coverPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!coverPreview && <BookOpen className="h-12 w-12" />}
        </div>
        <div className="p-4">
          <p className="text-xs font-bold text-primary">{selectedClass?.gradeLevel ?? selectedClass?.name ?? 'Umum'}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-extrabold text-ink">
            {form.title || 'Judul Modul'}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {form.description || 'Deskripsi modul akan tampil di sini.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.length ? (
              tags.map((tag) => (
                <span key={tag} className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">
                  {tag}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-muted-foreground">
                Tanpa tag
              </span>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-extrabold text-ink">{value}</p>
    </div>
  );
}

function ReadinessItem({ ready, label }: { ready: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold">
      <span className={ready ? 'grid h-7 w-7 place-items-center rounded-full bg-primary text-white' : 'grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-muted-foreground'}>
        <CheckCircle2 className="h-4 w-4" />
      </span>
      <span className={ready ? 'text-ink' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10';

function toFormState(initialData: ModuleEditorInitialData): FormState {
  return {
    ...initialData,
    lessons: initialData.lessons.length
      ? initialData.lessons.map((lesson, index) => ({
          ...lesson,
          clientId: lesson.id ?? `initial-lesson-${index + 1}`,
        }))
      : [createLessonState(1, 'initial-lesson-1')],
    quiz: {
      ...initialData.quiz,
      questions: initialData.quiz.questions.length
        ? initialData.quiz.questions.map((question, index) => ({
            ...question,
            clientId: question.id ?? `initial-question-${index + 1}`,
          }))
        : [createQuestionState('initial-question-1')],
    },
  };
}

function toRestoredFormState(draftForm: FormState): FormState {
  return {
    ...draftForm,
    lessons: draftForm.lessons.length
      ? draftForm.lessons.map((lesson, index) => ({
          ...lesson,
          clientId: lesson.clientId ?? lesson.id ?? `restored-lesson-${index + 1}`,
          infographicFile: undefined,
        }))
      : [createLessonState(1, 'restored-lesson-1')],
    quiz: {
      ...draftForm.quiz,
      questions: draftForm.quiz.questions.length
        ? draftForm.quiz.questions.map((question, index) => ({
            ...question,
            clientId: question.clientId ?? question.id ?? `restored-question-${index + 1}`,
          }))
        : [createQuestionState('restored-question-1')],
    },
  };
}

function stripFormFiles(form: FormState): FormState {
  return {
    ...form,
    lessons: form.lessons.map((lesson) => ({
      ...lesson,
      infographicFile: undefined,
    })),
  };
}

function createLessonState(orderIndex: number, clientId = createClientId('lesson')): LessonState {
  return {
    clientId,
    title: '',
    content: '',
    videoUrl: '',
    infographicUrl: '',
    infographicAssetId: undefined,
    infographicStatus: undefined,
    infographicSlideCount: undefined,
    infographicError: null,
    reflectionPrompt: '',
    orderIndex,
  };
}

function createQuestionState(clientId = createClientId('question'), orderIndex = 1): QuestionState {
  return {
    clientId,
    questionType: 'multiple_choice',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 'a',
    explanation: '',
    points: 10,
    orderIndex,
  };
}

function createClientId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function stripLessonState(lesson: LessonState): ModuleEditorLesson {
  return {
    id: lesson.id,
    title: lesson.title,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    infographicUrl: lesson.infographicUrl,
    infographicAssetId: lesson.infographicAssetId,
    infographicStatus: lesson.infographicStatus,
    infographicSlideCount: lesson.infographicSlideCount,
    infographicError: lesson.infographicError,
    reflectionPrompt: lesson.reflectionPrompt,
    orderIndex: lesson.orderIndex,
  };
}

function stripQuestionState(question: QuestionState): ModuleEditorQuestion {
  return {
    id: question.id,
    questionType: question.questionType,
    questionText: question.questionText,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    points: question.points,
    orderIndex: question.orderIndex,
  };
}

function getNextOrderIndex(items: { orderIndex: number }[]) {
  return Math.max(0, ...items.map((item) => Number(item.orderIndex) || 0)) + 1;
}

function reorderByClientId<T extends { clientId: string; orderIndex: number }>(
  items: T[],
  clientId: string,
  direction: -1 | 1,
) {
  const sortedItems = [...items].sort((first, second) => first.orderIndex - second.orderIndex);
  const index = sortedItems.findIndex((item) => item.clientId === clientId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= sortedItems.length) return items;

  const [moved] = sortedItems.splice(index, 1);
  sortedItems.splice(targetIndex, 0, moved);

  return renumberByOrder(sortedItems);
}

function renumberByOrder<T extends { orderIndex: number }>(items: T[]) {
  return items
    .map((item, index) => ({
      ...item,
      orderIndex: index + 1,
    }));
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function validateForm(intent: 'draft' | 'publish', form: FormState) {
  if (form.title.trim().length < 5) return 'Judul modul minimal 5 karakter.';
  if (form.description.trim().length < 20) return 'Deskripsi minimal 20 karakter.';
  if (!Number.isFinite(form.estimatedMinutes) || form.estimatedMinutes < 1) return 'Durasi belajar tidak valid.';
  if (intent === 'publish' && !form.lessons.some((lesson) => lesson.title.trim() && lesson.content.trim())) {
    return 'Tambahkan minimal satu lesson lengkap sebelum publish.';
  }
  if (intent === 'publish' && !form.quiz.questions.some((question) => question.questionText.trim())) {
    return 'Tambahkan minimal satu pertanyaan kuis sebelum publish.';
  }

  return null;
}

function formatDraftDate(value: string) {
  return formatDateTime(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shouldAutoUpdateSlug(form: FormState) {
  const currentSlug = form.slug.trim();
  if (!currentSlug) return true;
  return currentSlug === slugify(form.title);
}

async function uploadModuleFile(file: File, bucket: 'module-covers' | 'module-media', folder: string): Promise<UploadedAssetInput> {
  if (!isSupabaseConfigured) {
    return {
      bucket,
      path: '',
      publicUrl: URL.createObjectURL(file),
      mimeType: file.type,
      sizeBytes: file.size,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sesi upload belum aktif. Silakan masuk kembali.');
  }

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const path = `${user.id}/${folder}/${Date.now()}-${safeName || 'file'}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(
      error.message.includes('bucket') || error.message.includes('row-level security')
        ? `Upload gagal. Pastikan bucket ${bucket} dan policy storage sudah dibuat.`
        : error.message,
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    publicUrl: data.publicUrl,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

type InfographicUploadResult = {
  assetId: string;
  sourceUrl: string;
  status: LessonState['infographicStatus'];
  slideCount: number;
  errorMessage?: string | null;
};

type InfographicSlideImage = {
  index: number;
  url: string;
  path: string;
};

async function uploadInfographicFile(file: File, moduleId?: string): Promise<InfographicUploadResult> {
  if (isPptxFile(file)) {
    throw new Error(PPTX_UNSUPPORTED_MESSAGE);
  }

  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Infografik harus berupa PDF, PNG, JPG, WebP, atau GIF.');
  }

  const sourceAsset = await uploadModuleFile(file, 'module-media', 'infographics');

  if (!isSupabaseConfigured) {
    return {
      assetId: crypto.randomUUID(),
      sourceUrl: sourceAsset.publicUrl,
      status: 'ready',
      slideCount: 1,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Sesi upload belum aktif. Silakan masuk kembali.');

  const { data: asset, error: assetError } = await supabase
    .from('infographic_assets')
    .insert({
      module_id: moduleId ?? null,
      title: file.name,
      source_file_url: sourceAsset.publicUrl,
      source_file_type: file.type,
      processing_status: 'processing',
      created_by: user.id,
    })
    .select('id')
    .single<{ id: string }>();

  if (assetError) {
    throw new Error(
      assetError.message.includes('relation') || assetError.message.includes('row-level security')
        ? 'Gagal membuat metadata infografik. Pastikan schema dan RLS infographic_assets sudah dijalankan.'
        : assetError.message,
    );
  }

  if (file.type.startsWith('image/')) {
    const slideImages = [{ index: 1, url: sourceAsset.publicUrl, path: sourceAsset.path }];
    await updateInfographicAsset(asset.id, {
      processing_status: 'ready',
      slide_count: 1,
      slide_images: slideImages,
      error_message: null,
    });
    return { assetId: asset.id, sourceUrl: sourceAsset.publicUrl, status: 'ready', slideCount: 1 };
  }

  if (file.type === 'application/pdf') {
    try {
      const slideImages = await renderPdfToSlides(file, user.id, asset.id);
      await updateInfographicAsset(asset.id, {
        processing_status: 'ready',
        slide_count: slideImages.length,
        slide_images: slideImages,
        error_message: null,
      });
      return {
        assetId: asset.id,
        sourceUrl: sourceAsset.publicUrl,
        status: 'ready',
        slideCount: slideImages.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF gagal diproses menjadi slide.';
      await updateInfographicAsset(asset.id, {
        processing_status: 'failed',
        slide_count: 0,
        slide_images: [],
        error_message: message,
      });
      toast.error(message);
      return { assetId: asset.id, sourceUrl: sourceAsset.publicUrl, status: 'failed', slideCount: 0, errorMessage: message };
    }
  }

  throw new Error('Format infografik belum didukung.');
}

function isPptxFile(file: File) {
  return file.type === PPTX_MIME || file.name.toLowerCase().endsWith('.pptx');
}

function normalizeInfographicError(message?: string | null) {
  if (!message) return null;
  const normalized = message.toLowerCase();
  if (normalized.includes('pptx') || normalized.includes('libreoffice') || normalized.includes('worker')) {
    return PPTX_FAILED_MESSAGE;
  }
  return message;
}

async function updateInfographicAsset(assetId: string, payload: Record<string, unknown>) {
  const supabase = createClient();
  const { error } = await supabase.from('infographic_assets').update(payload).eq('id', assetId);
  if (error) throw error;
}

async function renderPdfToSlides(file: File, userId: string, assetId: string): Promise<InfographicSlideImage[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const supabase = createClient();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const slideImages: InfographicSlideImage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser tidak mendukung render canvas untuk PDF.');

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const blob = await canvasToBlob(canvas);
    const path = `${userId}/infographic-slides/${assetId}/slide-${pageNumber}.png`;
    const { error } = await supabase.storage.from('module-media').upload(path, blob, {
      cacheControl: '3600',
      contentType: 'image/png',
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabase.storage.from('module-media').getPublicUrl(path);
    slideImages.push({ index: pageNumber, url: data.publicUrl, path });
  }

  return slideImages;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('Gagal membuat gambar slide dari PDF.'));
    }, 'image/png');
  });
}
