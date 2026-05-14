'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
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
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
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

type StepId = 'info' | 'content' | 'quiz' | 'summary';

const steps: { id: StepId; label: string }[] = [
  { id: 'info', label: 'Informasi' },
  { id: 'content', label: 'Konten' },
  { id: 'quiz', label: 'Kuis' },
  { id: 'summary', label: 'Ringkasan' },
];

const optionIds = ['a', 'b', 'c', 'd'] as const;

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

  const activeStepIndex = steps.findIndex((step) => step.id === activeStep);
  const filledLessons = form.lessons.filter((lesson) => lesson.title.trim());
  const filledQuestions = form.quiz.questions.filter((question) => question.questionText.trim());
  const progressValue = Math.round(((activeStepIndex + 1) / steps.length) * 100);

  const selectedClass = useMemo(
    () => classes.find((classItem) => classItem.id === form.classId),
    [classes, form.classId],
  );

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateLesson(clientId: string, patch: Partial<LessonState>) {
    setForm((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) => (lesson.clientId === clientId ? { ...lesson, ...patch } : lesson)),
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
        setSavingIntent(null);
        return;
      }

      const uploadedCover = coverFile ? await uploadModuleFile(coverFile, 'module-covers', 'covers') : null;
      const lessonsWithUploads = await Promise.all(
        form.lessons.map(async (lesson) => {
          if (!lesson.infographicFile) return lesson;
          const uploaded = await uploadModuleFile(lesson.infographicFile, 'module-media', 'infographics');
          return { ...lesson, infographicUrl: uploaded.publicUrl };
        }),
      );
      const result = await saveTeacherModuleAction({
        moduleId: form.id,
        title: form.title,
        description: form.description,
        classId: form.classId,
        estimatedMinutes: form.estimatedMinutes,
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
      });

      if (!result.ok) {
        setError(result.error ?? 'Modul belum berhasil disimpan.');
        setSavingIntent(null);
        return;
      }

      setSuccess(intent === 'publish' ? 'Modul berhasil dipublikasikan.' : 'Draft modul berhasil disimpan.');
      if (result.moduleId && mode === 'create') {
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
          />
        )}

        {activeStep === 'content' && (
          <ContentStep
            lessons={form.lessons}
            updateLesson={updateLesson}
            addLesson={() =>
              setForm((current) => ({
                ...current,
                lessons: [...current.lessons, createLessonState(current.lessons.length + 1)],
              }))
            }
            removeLesson={(clientId) =>
              setForm((current) => ({
                ...current,
                lessons: current.lessons.length > 1 ? current.lessons.filter((lesson) => lesson.clientId !== clientId) : current.lessons,
              }))
            }
          />
        )}

        {activeStep === 'quiz' && (
          <QuizStep
            quiz={form.quiz}
            updateQuiz={(quizPatch) =>
              setForm((current) => ({ ...current, quiz: { ...current.quiz, ...quizPatch } }))
            }
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            addQuestion={() =>
              setForm((current) => ({
                ...current,
                quiz: {
                  ...current.quiz,
                  questions: [...current.quiz.questions, createQuestionState()],
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
                      ? current.quiz.questions.filter((question) => question.clientId !== clientId)
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
            {savingIntent === 'draft' ? 'Menyimpan...' : 'Save Draft'}
          </Button>
          {activeStep === 'summary' ? (
            <Button type="button" disabled={Boolean(savingIntent)} onClick={() => saveModule('publish')}>
              <CheckCircle2 className="h-4 w-4" />
              {savingIntent === 'publish' ? 'Publish...' : 'Publish'}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Selanjutnya
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
}: {
  form: FormState;
  classes: TeacherClassOption[];
  selectedClass?: TeacherClassOption;
  coverPreview: string;
  tagsText: string;
  onTagsChange: (value: string) => void;
  onCoverChange: (file: File | null) => void;
  updateForm: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
      <SectionCard>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Judul Modul" className="sm:col-span-2">
            <input
              value={form.title}
              onChange={(event) => updateForm({ title: event.target.value })}
              placeholder="Contoh: Adab dalam Islam"
              className={inputClass}
            />
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
          <Field label="Tag/Topik" className="sm:col-span-2">
            <input
              value={tagsText}
              onChange={(event) => onTagsChange(event.target.value)}
              placeholder="Pisahkan dengan koma, contoh: Akhlak, Adab, Sehari-hari"
              className={inputClass}
            />
          </Field>
          <Field label="Cover Image" className="sm:col-span-2">
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
  addLesson,
  removeLesson,
}: {
  lessons: LessonState[];
  updateLesson: (clientId: string, patch: Partial<LessonState>) => void;
  addLesson: () => void;
  removeLesson: (clientId: string) => void;
}) {
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
              <Button type="button" variant="ghost" size="sm" onClick={() => removeLesson(lesson.clientId)}>
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
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
              <Field label="Order Index">
                <input
                  type="number"
                  min={1}
                  value={lesson.orderIndex}
                  onChange={(event) => updateLesson(lesson.clientId, { orderIndex: Number(event.target.value) })}
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
                  placeholder="https://..."
                />
              </Field>
              <Field label="Upload Infografik" className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/20 bg-mint/25 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-mint/45">
                  <FileImage className="h-5 w-5" />
                  {lesson.infographicFile ? lesson.infographicFile.name : 'Pilih file infografik'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) =>
                      updateLesson(lesson.clientId, { infographicFile: event.target.files?.[0] ?? undefined })
                    }
                  />
                </label>
              </Field>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function QuizStep({
  quiz,
  updateQuiz,
  updateQuestion,
  updateQuestionOption,
  addQuestion,
  removeQuestion,
}: {
  quiz: FormState['quiz'];
  updateQuiz: (patch: Partial<FormState['quiz']>) => void;
  updateQuestion: (clientId: string, patch: Partial<QuestionState>) => void;
  updateQuestionOption: (clientId: string, optionIndex: number, value: string) => void;
  addQuestion: () => void;
  removeQuestion: (clientId: string) => void;
}) {
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
        <Field label="Passing Score">
          <input
            type="number"
            min={0}
            max={100}
            value={quiz.passingScore}
            onChange={(event) => updateQuiz({ passingScore: Number(event.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Max Attempts">
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
              <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(question.clientId)}>
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
            </div>
            <div className="grid gap-4">
              <Field label="Question Text">
                <textarea
                  value={question.questionText}
                  onChange={(event) => updateQuestion(question.clientId, { questionText: event.target.value })}
                  className={cn(inputClass, 'min-h-24 resize-none py-3')}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                {optionIds.map((optionId, optionIndex) => (
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
}: {
  form: FormState;
  tags: string[];
  coverPreview: string;
  selectedClass?: TeacherClassOption;
  filledLessons: number;
  filledQuestions: number;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
      <SectionCard>
        <p className="font-bold text-ink">Preview Final</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SummaryMetric label="Judul" value={form.title || '-'} />
          <SummaryMetric label="Status" value={form.status === 'published' ? 'Aktif' : 'Draft'} />
          <SummaryMetric label="Kelas/Tingkat" value={selectedClass?.name ?? 'Umum'} />
          <SummaryMetric label="Durasi" value={`${form.estimatedMinutes || 0} menit`} />
          <SummaryMetric label="Lessons" value={`${filledLessons} lesson`} />
          <SummaryMetric label="Pertanyaan Kuis" value={`${filledQuestions} pertanyaan`} />
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

function createLessonState(orderIndex: number, clientId = createClientId('lesson')): LessonState {
  return {
    clientId,
    title: '',
    content: '',
    videoUrl: '',
    infographicUrl: '',
    orderIndex,
  };
}

function createQuestionState(clientId = createClientId('question')): QuestionState {
  return {
    clientId,
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 'a',
    explanation: '',
    points: 10,
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
    orderIndex: lesson.orderIndex,
  };
}

function stripQuestionState(question: QuestionState): ModuleEditorQuestion {
  return {
    id: question.id,
    questionText: question.questionText,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    points: question.points,
  };
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function validateForm(intent: 'draft' | 'publish', form: FormState) {
  if (!form.title.trim()) return 'Judul modul wajib diisi.';
  if (!form.description.trim()) return 'Deskripsi singkat wajib diisi.';
  if (!Number.isFinite(form.estimatedMinutes) || form.estimatedMinutes < 1) return 'Durasi belajar tidak valid.';
  if (intent === 'publish' && !form.lessons.some((lesson) => lesson.title.trim() && lesson.content.trim())) {
    return 'Tambahkan minimal satu lesson lengkap sebelum publish.';
  }
  if (intent === 'publish' && !form.quiz.questions.some((question) => question.questionText.trim())) {
    return 'Tambahkan minimal satu pertanyaan kuis sebelum publish.';
  }

  return null;
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
