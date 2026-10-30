'use client';

import { CheckCircle2 } from 'lucide-react';
import { SectionCard } from '@/components/shared/section-card';
import { Field, inputClass } from '@/components/teacher/module-editor-fields';
import { ModulePreview } from '@/components/teacher/module-editor-preview';
import type { FormState, NotificationState } from '@/components/teacher/module-editor-types';
import type { TeacherClassOption } from '@/lib/teacher/module-editor';
import { cn } from '@/lib/utils';

export function SummaryStep({
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
          <SummaryMetric className="sm:col-span-2" label="Judul" value={form.title || '-'} />
          <div className="rounded-2xl border border-border bg-white p-4 sm:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground">Deskripsi</p>
            <p className="mt-1 whitespace-pre-wrap text-base font-extrabold leading-6 text-ink">{form.description || '-'}</p>
          </div>
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
      </SectionCard>

      <ModulePreview form={form} coverPreview={coverPreview} selectedClass={selectedClass} tags={tags} />
    </div>
  );
}

function SummaryMetric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-white p-4', className)}>
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

