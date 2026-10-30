'use client';

import { memo } from 'react';
import { FileImage, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/teacher/module-editor-fields';
import { isPptxFile, normalizeInfographicError, PPTX_MIME, PPTX_UNSUPPORTED_MESSAGE } from '@/components/teacher/module-editor-infographic';
import type { LessonState } from '@/components/teacher/module-editor-types';
import { cn } from '@/lib/utils';

export function ContentStep({
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
          <LessonItem
            key={lesson.clientId}
            lesson={lesson}
            index={index}
            count={lessons.length}
            updateLesson={updateLesson}
            reorderLessons={reorderLessons}
            removeLesson={removeLesson}
          />
        ))}
      </div>
    </SectionCard>
  );
}

const LessonItem = memo(function LessonItem({
  lesson, index, count, updateLesson, reorderLessons, removeLesson,
}: {
  lesson: LessonState;
  index: number;
  count: number;
  updateLesson: (clientId: string, patch: Partial<LessonState>) => void;
  reorderLessons: (clientId: string, direction: -1 | 1) => void;
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
    <div className="rounded-2xl border border-border bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-bold text-ink">Lesson {index + 1}</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderLessons(lesson.clientId, -1)} disabled={index === 0}>
                  Naik
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderLessons(lesson.clientId, 1)} disabled={index === count - 1}>
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
              <Field label="Poin Penting" className="sm:col-span-2">
                <textarea
                  value={lesson.keyPoints === null ? deriveKeyPoints(lesson.content).join('\n') : lesson.keyPoints.join('\n')}
                  onChange={(event) => updateLesson(lesson.clientId, { keyPoints: event.target.value.split('\n') })}
                  className={cn(inputClass, 'min-h-28 resize-y py-3')}
                  placeholder="Satu poin per baris..."
                  aria-describedby={`lesson-key-points-help-${lesson.clientId}`}
                />
                <p id={`lesson-key-points-help-${lesson.clientId}`} className="mt-2 text-xs leading-5 text-muted-foreground">
                  Isi satu poin per baris. Poin yang sudah ada dari materi ditampilkan sebagai nilai awal.
                </p>
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
  );
});

function deriveKeyPoints(content: string) {
  return content
    .split(/\n{2,}/)
    .flatMap((paragraph) => paragraph.split(/(?<=\.)\s+(?=[A-Z0-9"'(])/))
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 3);
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

