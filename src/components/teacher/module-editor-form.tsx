'use client';

import { browserStorage } from '@/lib/browser-storage';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Images,
  ImageUp,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ProgressBar } from '@/components/shared/progress-bar';
import { CroppedImage } from '@/components/shared/cropped-image';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, inputClass } from '@/components/teacher/module-editor-fields';
import { EditableNumberInput } from '@/components/teacher/editable-number-input';
import { ModulePreview } from '@/components/teacher/module-editor-preview';
import { ModuleCoverCropDialog, type ModuleCoverCropSource } from '@/components/teacher/module-cover-crop-dialog';
import type { FormState, LessonState, NotificationState, QuestionState } from '@/components/teacher/module-editor-types';
import { formatDateTime } from '@/lib/date';
import { saveTeacherModuleAction } from '@/lib/teacher/module-actions';
import type {
  ModuleEditorInitialData,
  ModuleEditorLesson,
  ModuleEditorQuestion,
  ModuleCoverGalleryImage,
  TeacherClassOption,
} from '@/lib/teacher/module-editor';
import { cn } from '@/lib/utils';
import type { ModuleImageCropConfig } from '@/lib/media/image-crops';

type ModuleEditorFormProps = {
  mode: 'create' | 'edit';
  teacherId: string;
  initialData: ModuleEditorInitialData;
  classes: TeacherClassOption[];
  coverGallery: ModuleCoverGalleryImage[];
};

type LocalModuleDraft = {
  form: FormState;
  tagsText: string;
  coverPreview: string;
  notification: NotificationState;
  savedAt: string;
};

type StepId = 'info' | 'content' | 'quiz' | 'summary';
const steps: { id: StepId; label: string }[] = [
  { id: 'info', label: 'Informasi' },
  { id: 'content', label: 'Konten' },
  { id: 'quiz', label: 'Kuis' },
  { id: 'summary', label: 'Ringkasan' },
];

const ContentStep = dynamic(
  () => import('@/components/teacher/module-editor-content-step').then((module) => module.ContentStep),
  { loading: StepFallback },
);
const QuizStep = dynamic(
  () => import('@/components/teacher/module-editor-quiz-step').then((module) => module.QuizStep),
  { loading: StepFallback },
);
const SummaryStep = dynamic(
  () => import('@/components/teacher/module-editor-summary-step').then((module) => module.SummaryStep),
  { loading: StepFallback },
);

function StepFallback() {
  return <SectionCard><p role="status" className="text-sm text-muted-foreground">Memuat bagian editor...</p></SectionCard>;
}

export function ModuleEditorForm({ mode, teacherId, initialData, classes, coverGallery }: ModuleEditorFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = searchParams?.get('step') === 'quiz' ? 'quiz' : 'info';
  const [activeStep, setActiveStep] = useState<StepId>(initialStep);
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<ModuleCoverCropSource | null>(null);
  const [coverPreview, setCoverPreview] = useState(initialData.coverImagePath);
  const [tagsText, setTagsText] = useState(initialData.tags.join(', '));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingIntent, setSavingIntent] = useState<'draft' | 'publish' | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    enabled: mode === 'create',
    message: '',
  });
  const draftStorageKey = `wasatify:module-editor:${teacherId}:${mode}:${initialData.id ?? 'new'}`;
  const restoredDraftRef = useRef(false);
  const coverObjectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (coverObjectUrlRef.current) URL.revokeObjectURL(coverObjectUrlRef.current);
  }, []);

  const activeStepIndex = steps.findIndex((step) => step.id === activeStep);
  const filledLessons = form.lessons.filter((lesson) => lesson.title.trim());
  const filledQuestions = form.quiz.questions.filter((question) => question.questionText.trim());
  const completedSteps: Record<StepId, boolean> = {
    info: isInfoStepComplete(form),
    content: form.lessons.some((lesson) => lesson.title.trim() && lesson.content.trim()),
    quiz: form.quiz.questions.some(isQuestionComplete),
    summary: isInfoStepComplete(form)
      && form.lessons.some((lesson) => lesson.title.trim() && lesson.content.trim())
      && form.quiz.questions.some(isQuestionComplete),
  };
  const progressValue = Math.round(((activeStepIndex + 1) / steps.length) * 100);

  const selectedClass = useMemo(
    () => classes.find((classItem) => classItem.id === form.classId),
    [classes, form.classId],
  );

  useEffect(() => {
    if (restoredDraftRef.current) return;
    restoredDraftRef.current = true;

    try {
      const rawDraft = browserStorage.get(draftStorageKey);
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
      browserStorage.remove(draftStorageKey);
    }
  }, [draftStorageKey, mode]);

  useEffect(() => {
    let idleId: number | undefined;
    const writeDraft = () => {
      try {
        const draft: LocalModuleDraft = {
          form: stripFormFiles(form),
          tagsText,
          coverPreview: coverObjectUrlRef.current ? form.coverImagePath : coverPreview,
          notification,
          savedAt: new Date().toISOString(),
        };
        browserStorage.set(draftStorageKey, JSON.stringify(draft));
      } catch {
        // Local autosave is best-effort only. Server save remains the source of truth.
      }
    };
    const timeout = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(writeDraft, { timeout: 2000 });
      } else {
        writeDraft();
      }
    }, 800);

    return () => {
      window.clearTimeout(timeout);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
  }, [coverPreview, draftStorageKey, form, notification, tagsText]);

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function changeCover(file: File | null) {
    if (file) setCropSource({ file, imageUrl: null, name: file.name });
  }

  function selectGalleryCover(image: ModuleCoverGalleryImage) {
    setCropSource({ file: null, imageUrl: image.publicUrl, name: image.title });
  }

  function applyCroppedCover(result: { file: File | null; crops: ModuleImageCropConfig }) {
    if (!cropSource) return;
    if (coverObjectUrlRef.current) URL.revokeObjectURL(coverObjectUrlRef.current);
    const preview = result.file ? URL.createObjectURL(result.file) : cropSource.imageUrl ?? '';
    coverObjectUrlRef.current = result.file ? preview : null;
    setCoverFile(result.file);
    setCoverPreview(preview);
    setForm((current) => ({
      ...current,
      coverImagePath: result.file ? '' : cropSource.imageUrl ?? current.coverImagePath,
      heroImagePath: '',
      imageCropConfig: result.crops,
    }));
    setCropSource(null);
  }

  function changeCoverUrl(value: string) {
    if (coverObjectUrlRef.current) URL.revokeObjectURL(coverObjectUrlRef.current);
    coverObjectUrlRef.current = null;
    setCoverFile(null);
    setForm((current) => ({ ...current, coverImagePath: value, heroImagePath: '', imageCropConfig: null }));
    setCoverPreview(value);
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

const updateLesson = useCallback((clientId: string, patch: Partial<LessonState>) => {
    setForm((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) => (lesson.clientId === clientId ? { ...lesson, ...patch } : lesson)),
    }));
  }, []);

  const reorderLessons = useCallback((clientId: string, direction: -1 | 1) => {
    setForm((current) => ({
      ...current,
      lessons: reorderByClientId(current.lessons, clientId, direction),
    }));
  }, []);

  const updateQuestion = useCallback((clientId: string, patch: Partial<QuestionState>) => {
    setForm((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        questions: current.quiz.questions.map((question) =>
          question.clientId === clientId ? { ...question, ...patch } : question,
        ),
      },
    }));
  }, []);

  const updateQuestionOption = useCallback((clientId: string, optionIndex: number, value: string) => {
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
  }, []);

  const reorderQuestions = useCallback((clientId: string, direction: -1 | 1) => {
    setForm((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        questions: reorderByClientId(current.quiz.questions, clientId, direction),
      },
    }));
  }, []);

  const addLesson = useCallback(() => {
    setForm((current) => ({
      ...current,
      lessons: [...current.lessons, createLessonState(getNextOrderIndex(current.lessons))],
    }));
  }, []);

  const removeLesson = useCallback((clientId: string) => {
    setForm((current) => ({
      ...current,
      lessons: current.lessons.length > 1
        ? renumberByOrder(current.lessons.filter((lesson) => lesson.clientId !== clientId))
        : current.lessons,
    }));
  }, []);

  const addQuestion = useCallback(() => {
    setForm((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        questions: [...current.quiz.questions, createQuestionState(undefined, getNextOrderIndex(current.quiz.questions))],
      },
    }));
  }, []);

  const removeQuestion = useCallback((clientId: string) => {
    setForm((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        questions: current.quiz.questions.length > 1
          ? renumberByOrder(current.quiz.questions.filter((question) => question.clientId !== clientId))
          : current.quiz.questions,
      },
    }));
  }, []);

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

      if (
        intent === 'publish' &&
        form.orderIndex > 1 &&
        !window.confirm(
          'Modul dengan urutan ini dapat terkunci bagi siswa yang belum menyelesaikan modul terbit sebelumnya. Tetap publikasikan sebagai modul lanjutan?',
        )
      ) {
        setSavingIntent(null);
        return;
      }

      const uploads = coverFile || form.lessons.some((lesson) => lesson.infographicFile)
        ? await import('@/components/teacher/module-editor-uploads')
        : null;
      const uploadedCover = coverFile ? await uploads!.uploadModuleFile(coverFile, 'module-covers', 'covers') : null;
      const lessonsWithUploads = await Promise.all(
        form.lessons.map(async (lesson) => {
          if (!lesson.infographicFile) return lesson;
          const infographic = await uploads!.uploadInfographicFile(lesson.infographicFile, form.id);
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
        heroImagePath: form.heroImagePath,
        imageCropConfig: form.imageCropConfig,
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
      browserStorage.remove(draftStorageKey);
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
                  : completedSteps[step.id]
                    ? 'border-primary/20 bg-mint text-primary'
                    : 'border-border bg-white text-muted-foreground hover:bg-mint/40 hover:text-primary',
              )}
              aria-current={activeStep === step.id ? 'step' : undefined}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/18 text-xs">
                {completedSteps[step.id] ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
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
            coverGallery={coverGallery}
            selectedClass={selectedClass}
            coverPreview={coverPreview}
            cropSource={cropSource}
            tagsText={tagsText}
            onTagsChange={setTagsText}
            onCoverChange={changeCover}
            onCropOpenChange={(open) => !open && setCropSource(null)}
            onCroppedCoverChange={applyCroppedCover}
            onCoverUrlChange={changeCoverUrl}
            onCoverGallerySelect={selectGalleryCover}
            updateForm={updateForm}
            updateTitle={updateTitle}
          />
        )}

        {activeStep === 'content' && (
          <ContentStep
            lessons={form.lessons}
            updateLesson={updateLesson}
            reorderLessons={reorderLessons}
            addLesson={addLesson}
            removeLesson={removeLesson}
          />
        )}

        {activeStep === 'quiz' && (
          <QuizStep
            quiz={form.quiz}
            updateQuiz={(quizPatch) => setForm((current) => ({ ...current, quiz: normalizeQuizPatch(current.quiz, quizPatch) }))}
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            reorderQuestions={reorderQuestions}
            addQuestion={addQuestion}
            removeQuestion={removeQuestion}
            onImportQuestions={(questions) => setForm((current) => {
              const existingQuestions = current.quiz.questions.filter((question) => question.questionText.trim());
              const importedQuestions = questions.map((question, index) => ({
                ...question,
                clientId: createClientId('question'),
                orderIndex: existingQuestions.length + index + 1,
              }));

              return {
                ...current,
                quiz: {
                  ...current.quiz,
                  questions: [...existingQuestions, ...importedQuestions],
                },
              };
            })}
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
  coverGallery,
  selectedClass,
  coverPreview,
  cropSource,
  tagsText,
  onTagsChange,
  onCoverChange,
  onCropOpenChange,
  onCroppedCoverChange,
  onCoverUrlChange,
  onCoverGallerySelect,
  updateForm,
  updateTitle,
}: {
  form: FormState;
  classes: TeacherClassOption[];
  coverGallery: ModuleCoverGalleryImage[];
  selectedClass?: TeacherClassOption;
  coverPreview: string;
  cropSource: ModuleCoverCropSource | null;
  tagsText: string;
  onTagsChange: (value: string) => void;
  onCoverChange: (file: File | null) => void;
  onCropOpenChange: (open: boolean) => void;
  onCroppedCoverChange: (result: { file: File | null; crops: ModuleImageCropConfig }) => void;
  onCoverUrlChange: (value: string) => void;
  onCoverGallerySelect: (image: ModuleCoverGalleryImage) => void;
  updateForm: (patch: Partial<FormState>) => void;
  updateTitle: (title: string) => void;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const heroSource = form.imageCropConfig ? coverPreview : form.heroImagePath || coverPreview;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)]">
      <SectionCard>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Judul Modul" className="sm:col-span-2">
            <input
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="Contoh: Adab dalam Islam"
              className={inputClass}
            />
          </Field>
          <Field label="Deskripsi Singkat" className="sm:col-span-2">
            <textarea
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
              placeholder="Tuliskan ringkasan modul, minimal 20 karakter."
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
            <EditableNumberInput
              min={1}
              value={form.estimatedMinutes}
              onValueChange={(estimatedMinutes) => updateForm({ estimatedMinutes })}
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
              <option value="published">Dipublikasikan</option>
              <option value="archived">Diarsipkan</option>
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
              onChange={(event) => onCoverUrlChange(event.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setGalleryOpen(true)}>
              <Images className="h-4 w-4" />
              Pilih dari Galeri
            </Button>
            {form.coverImagePath && (
              <p className="mt-2 truncate text-xs text-muted-foreground" title={form.coverImagePath}>
                Cover terpilih: {coverGallery.find((image) => image.publicUrl === form.coverImagePath)?.title ?? form.coverImagePath}
              </p>
            )}
          </div>
          <Field label="Upload Cover Image" className="sm:col-span-2">
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-mint/35 px-4 py-6 text-center transition hover:bg-mint/55">
              <ImageUp className="h-8 w-8 text-primary" />
              <span className="mt-3 text-sm font-bold text-ink">Upload cover modul</span>
              <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, atau WebP. Gambar dikonversi ke WebP dan disimpan satu kali.</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  onCoverChange(event.target.files?.[0] ?? null);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            {(coverPreview || heroSource) && (
              <div className="mt-3 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold text-ink">Hero desktop · 4:3</p>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-mint/40">
                    {heroSource && <CroppedImage src={heroSource} crop={form.imageCropConfig?.heroDesktop} alt="Preview hero desktop" sizes="240px" />}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold text-ink">Hero HP · 16:9</p>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-mint/40">
                    {heroSource && <CroppedImage src={heroSource} crop={form.imageCropConfig?.heroMobile} alt="Preview hero HP" sizes="240px" />}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold text-ink">Thumbnail card · 1:1</p>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-mint/40">
                    {coverPreview && <CroppedImage src={coverPreview} crop={form.imageCropConfig?.thumbnail} alt="Preview thumbnail" sizes="240px" />}
                  </div>
                </div>
              </div>
            )}
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

      <ModuleCoverCropDialog
        source={cropSource}
        open={Boolean(cropSource)}
        onOpenChange={onCropOpenChange}
        onApply={onCroppedCoverChange}
      />

      <ModulePreview form={form} coverPreview={coverPreview} selectedClass={selectedClass} tags={parseTags(tagsText)} />

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-ink">Pilih cover dari galeri</DialogTitle>
            <DialogDescription>Pilih gambar yang pernah diunggah ke galeri media.</DialogDescription>
          </DialogHeader>
          {coverGallery.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {coverGallery.map((image) => {
                const isSelected = form.coverImagePath === image.publicUrl;
                return (
                  <button
                    key={image.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      onCoverGallerySelect(image);
                      setGalleryOpen(false);
                    }}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-white text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border',
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-mint/30">
                      <Image src={image.publicUrl} alt="" fill sizes="(max-width: 640px) 45vw, 240px" className="object-cover" />
                    </div>
                    <span className="block truncate px-3 py-2 text-xs font-semibold text-ink">{image.title}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-mint/20 px-5 py-8 text-center">
              <Images className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-bold text-ink">Belum ada gambar di galeri</p>
              <p className="mt-1 text-sm text-muted-foreground">Unggah gambar pada bagian Upload Cover Image atau halaman Media.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toFormState(initialData: ModuleEditorInitialData): FormState {
  return {
    ...initialData,
    lessons: initialData.lessons.length
      ? initialData.lessons.map((lesson, index) => ({
          ...lesson,
          keyPoints: Array.isArray(lesson.keyPoints) ? lesson.keyPoints : null,
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
          keyPoints: Array.isArray(lesson.keyPoints) ? lesson.keyPoints : null,
          clientId: lesson.clientId ?? lesson.id ?? `restored-lesson-${index + 1}`,
          infographicFile: undefined,
        }))
      : [createLessonState(1, 'restored-lesson-1')],
    quiz: {
      ...draftForm.quiz,
      questions: draftForm.quiz.questions.length
        ? draftForm.quiz.questions.map((question, index) => ({
            ...question,
            questionType: 'multiple_choice' as const,
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
    keyPoints: [],
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
    options: ['', '', '', '', ''],
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
    keyPoints: lesson.keyPoints,
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

function isInfoStepComplete(form: FormState) {
  return form.title.trim().length >= 5
    && form.description.trim().length >= 20
    && Number.isFinite(form.estimatedMinutes)
    && form.estimatedMinutes >= 1;
}

function isQuestionComplete(question: QuestionState) {
  return Boolean(question.questionText.trim())
    && question.options.every((option) => option.trim())
    && Boolean(question.explanation.trim())
    && Number.isFinite(question.points)
    && question.points >= 1;
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
