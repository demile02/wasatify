'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { CalendarClock, ClipboardList, Download, FileText, FileUp, Send, UserRoundCheck, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAsyncAction } from '@/hooks/use-async-action';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/date';
import { assignmentFileAccept, assignmentFileBucket, formatFileSize, getAssignmentFileDetails, maxAssignmentFileSize } from '@/lib/assignments/files';
import type { AssignmentAttachment } from '@/lib/assignments/types';
import { createAssignmentAction, reviewAssignmentAction } from '@/lib/teacher/assignment-actions';
import { submitAssignmentAction } from '@/lib/student/assignment-actions';
import type { AssignmentItem, AssignmentPageData } from '@/lib/assignments/types';
import { getDemoAssignmentFile, removeDemoAssignmentFile, storeDemoAssignmentFile } from '@/lib/demo/assignment-file-storage';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type DemoAssignmentActions = {
  onCreate?: (input: { classId: string; title: string; instructions: string; dueAt: string | null }) => void;
  onSubmit?: (input: { assignmentId: string; answer: string; attachment: AssignmentAttachment | null }) => void | Promise<void>;
  onReview?: (input: { submissionId: string; score: number; feedback: string }) => void;
};

type AssignmentBoardProps = AssignmentPageData & {
  mode: 'student' | 'teacher';
  basePath: string;
  isDemo?: boolean;
} & DemoAssignmentActions;

export function AssignmentBoard({
  items,
  classes = [],
  page,
  hasNextPage,
  hasPreviousPage,
  mode,
  basePath,
  isDemo = false,
  onCreate,
  onSubmit,
  onReview,
}: AssignmentBoardProps) {
  const isTeacher = mode === 'teacher';
  const [isPending, runAction] = useAsyncAction();
  const [classId, setClassId] = useState(classes[0]?.id ?? '');

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const dueInput = String(values.get('dueAt') ?? '').trim();
    const input = {
      classId: String(values.get('classId') ?? ''),
      title: String(values.get('title') ?? '').trim(),
      instructions: String(values.get('instructions') ?? '').trim(),
      dueAt: dueInput ? parseLocalDateTime(dueInput) : null,
    };

    if (dueInput && !input.dueAt) {
      toast.error('Batas waktu tugas tidak valid.');
      return;
    }

    runAction(async () => {
      if (isDemo) {
        onCreate?.(input);
        form.reset();
        toast.success('Tugas demo berhasil dibuat.');
        return;
      }
      const result = await createAssignmentAction(input);
      if (!result.ok) {
        toast.error(result.error ?? 'Tugas belum berhasil dibuat.');
        return;
      }
      form.reset();
      toast.success('Tugas berhasil dibagikan ke kelas.');
      window.location.reload();
    });
  }

  if (isTeacher) {
    return (
      <div className="mt-6 space-y-6">
        <SectionCard>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-primary"><FileText className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 className="font-bold text-ink">Buat tugas kelas</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Tulis instruksi, tentukan kelas dan batas waktu. Jawaban siswa dapat diperbarui sampai dinilai.</p>
            </div>
          </div>
          {!classes.length ? (
            <EmptyState className="mt-5" icon={ClipboardList} title="Belum ada kelas" description="Buat kelas terlebih dahulu sebelum membagikan tugas." />
          ) : (
            <form onSubmit={submitCreate} className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
              <label className="min-w-0 text-sm font-semibold text-ink">
                Kelas
                <select name="classId" required value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                  {classes.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.name}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-sm font-semibold text-ink">
                Batas waktu <span className="font-normal text-muted-foreground">(opsional)</span>
                <input name="dueAt" type="datetime-local" className="mt-2 h-12 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
              </label>
              <label className="min-w-0 text-sm font-semibold text-ink lg:col-span-2">
                Judul tugas
                <input name="title" required minLength={5} maxLength={120} className="mt-2 h-12 w-full min-w-0 rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
              </label>
              <label className="min-w-0 text-sm font-semibold text-ink lg:col-span-2">
                Instruksi
                <Textarea name="instructions" required minLength={20} maxLength={5000} rows={4} placeholder="Jelaskan tugas yang perlu dikerjakan siswa..." className="mt-2 min-h-28 rounded-xl bg-white text-sm leading-6" />
              </label>
              <Button type="submit" disabled={isPending || !classId} className="min-h-11 w-full sm:w-auto lg:col-span-2 lg:justify-self-end"><Send className="h-4 w-4" />Bagikan tugas</Button>
            </form>
          )}
        </SectionCard>

        {items.length ? (
          <div className="grid min-w-0 gap-4">
            {items.map((item) => <TeacherAssignmentCard key={item.id} item={item} isPending={isPending} runAction={runAction} isDemo={isDemo} onReview={onReview} />)}
            <AssignmentPagination basePath={basePath} page={page} hasNextPage={hasNextPage} hasPreviousPage={hasPreviousPage} />
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="Belum ada tugas" description="Tugas yang kamu bagikan ke kelas akan muncul di sini." />
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 grid min-w-0 gap-4">
      {items.length ? items.map((item) => (
        <StudentAssignmentCard key={item.id} item={item} isPending={isPending} runAction={runAction} isDemo={isDemo} onSubmit={onSubmit} />
      )) : <EmptyState icon={ClipboardList} title="Belum ada tugas" description="Tugas dari gurumu akan tampil di sini." />}
      <AssignmentPagination basePath={basePath} page={page} hasNextPage={hasNextPage} hasPreviousPage={hasPreviousPage} />
    </div>
  );
}

function TeacherAssignmentCard({
  item,
  isPending,
  runAction,
  isDemo,
  onReview,
}: {
  item: AssignmentItem;
  isPending: boolean;
  runAction: (action: () => Promise<void>) => void;
  isDemo: boolean;
  onReview?: DemoAssignmentActions['onReview'];
}) {
  const submissions = item.submissions ?? [];
  const pendingCount = submissions.filter((submission) => submission.status === 'submitted').length;

  return (
    <SectionCard as="article" className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-mint text-primary">{item.className}</Badge>
            <Badge className={cn(pendingCount ? 'bg-gold text-white' : 'bg-slate-100 text-slate-600')}>{pendingCount ? `${pendingCount} perlu dinilai` : 'Semua sudah dinilai'}</Badge>
          </div>
          <h2 className="mt-3 break-words text-lg font-bold text-ink">{item.title}</h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{item.instructions}</p>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            {item.dueAt ? `Batas ${formatDateTime(item.dueAt)}` : 'Tanpa batas waktu'}
          </p>
        </div>
        <Badge className="bg-white text-muted-foreground">{submissions.length} jawaban</Badge>
      </div>

      {submissions.length ? (
        <details className="mt-5 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-bold text-primary">Lihat jawaban siswa</summary>
          <div className="mt-4 grid min-w-0 gap-3">
            {submissions.map((submission) => (
              <article key={submission.id} className="min-w-0 rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-ink">{submission.studentName}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Dikirim {formatDateTime(submission.submittedAt)}</p>
                  </div>
                  <Badge className={submission.status === 'reviewed' ? 'bg-mint text-primary' : 'bg-gold text-white'}>
                    {submission.status === 'reviewed' ? `Nilai ${submission.score}/100` : 'Perlu dinilai'}
                  </Badge>
                </div>
                {submission.answer && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{submission.answer}</p>}
                {submission.attachment && <AssignmentAttachmentDownload attachment={submission.attachment} isDemo={isDemo} />}
                {submission.status === 'reviewed' ? (
                  submission.feedback && <p className="mt-3 rounded-xl bg-mint/50 p-3 text-sm leading-6 text-foreground"><span className="font-bold text-primary">Catatan: </span>{submission.feedback}</p>
                ) : (
                  <ReviewForm submissionId={submission.id} isPending={isPending} runAction={runAction} isDemo={isDemo} onReview={onReview} />
                )}
              </article>
            ))}
          </div>
        </details>
      ) : (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">Belum ada siswa yang mengirim jawaban.</p>
      )}
    </SectionCard>
  );
}

function ReviewForm({
  submissionId,
  isPending,
  runAction,
  isDemo,
  onReview,
}: {
  submissionId: string;
  isPending: boolean;
  runAction: (action: () => Promise<void>) => void;
  isDemo: boolean;
  onReview?: DemoAssignmentActions['onReview'];
}) {
  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const score = Number(values.get('score'));
    const feedback = String(values.get('feedback') ?? '').trim();
    runAction(async () => {
      if (isDemo) {
        onReview?.({ submissionId, score, feedback });
        toast.success('Jawaban demo berhasil dinilai.');
        return;
      }
      const result = await reviewAssignmentAction({ submissionId, score, feedback });
      if (!result.ok) {
        toast.error(result.error ?? 'Penilaian belum berhasil disimpan.');
        return;
      }
      toast.success('Nilai dan catatan berhasil disimpan.');
      window.location.reload();
    });
  }

  return (
    <form onSubmit={submitReview} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[7rem_1fr_auto] sm:items-end">
      <label className="text-sm font-semibold text-ink">Nilai
        <input name="score" type="number" min={0} max={100} required className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground" />
      </label>
      <label className="min-w-0 text-sm font-semibold text-ink">Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
        <input name="feedback" maxLength={2000} className="mt-1 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground" />
      </label>
      <Button type="submit" disabled={isPending} size="sm" className="min-h-11 w-full sm:w-auto"><UserRoundCheck className="h-4 w-4" />Simpan nilai</Button>
    </form>
  );
}

function StudentAssignmentCard({
  item,
  isPending,
  runAction,
  isDemo,
  onSubmit,
}: {
  item: AssignmentItem;
  isPending: boolean;
  runAction: (action: () => Promise<void>) => void;
  isDemo: boolean;
  onSubmit?: DemoAssignmentActions['onSubmit'];
}) {
  const submission = item.submission;
  const isReviewed = submission?.status === 'reviewed';
  const [now, setNow] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const isExpired = Boolean(now !== null && item.dueAt && new Date(item.dueAt).getTime() < now);
  const retainedAttachment = !removeExistingFile ? submission?.attachment ?? null : null;
  const hasAttachment = Boolean(selectedFile || retainedAttachment);

  useEffect(() => setNow(Date.now()), []);

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const answer = String(values.get('answer') ?? '').trim();
    if (answer.length > 0 && answer.length < 20) {
      toast.error('Jawaban teks minimal 20 karakter.');
      return;
    }
    if (!answer && !selectedFile && !retainedAttachment) {
      toast.error('Tulis jawaban atau lampirkan berkas terlebih dahulu.');
      return;
    }
    if (selectedFile) {
      const fileValidation = getAssignmentFileDetails(selectedFile);
      if ('error' in fileValidation) {
        toast.error(fileValidation.error);
        return;
      }
    }
    runAction(async () => {
      if (isDemo) {
        let nextAttachment = retainedAttachment;
        let newDemoFileId: string | null = null;
        try {
          if (selectedFile) {
            const details = getAssignmentFileDetails(selectedFile);
            if ('error' in details) throw new Error(details.error);
            newDemoFileId = await storeDemoAssignmentFile(selectedFile);
            nextAttachment = {
              path: null,
              fileName: selectedFile.name.slice(0, 255),
              fileSize: selectedFile.size,
              fileType: details.mimeType,
              demoFileId: newDemoFileId,
            };
          }
          await onSubmit?.({ assignmentId: item.id, answer, attachment: nextAttachment });
        } catch (error) {
          if (newDemoFileId) await removeDemoAssignmentFile(newDemoFileId).catch(() => undefined);
          toast.error(error instanceof Error ? error.message : 'Jawaban demo belum berhasil disimpan.');
          return;
        }
        const oldDemoFileId = submission?.attachment?.demoFileId;
        if (oldDemoFileId && oldDemoFileId !== nextAttachment?.demoFileId) {
          try {
            await removeDemoAssignmentFile(oldDemoFileId);
          } catch {
            toast.warning('Jawaban tersimpan, tetapi lampiran demo lama belum dapat dihapus.');
          }
        }
        setSelectedFile(null);
        setRemoveExistingFile(false);
        toast.success('Jawaban demo berhasil dikirim.');
        return;
      }
      const supabase = createClient();
      let nextAttachment = retainedAttachment;
      let uploadedPath: string | null = null;
      if (selectedFile) {
        const details = getAssignmentFileDetails(selectedFile);
        if ('error' in details) {
          toast.error(details.error);
          return;
        }
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          toast.error('Sesi siswa tidak ditemukan. Silakan masuk kembali.');
          return;
        }
        const path = `${authData.user.id}/${item.id}/${crypto.randomUUID()}.${details.extension}`;
        const { error: uploadError } = await supabase.storage.from(assignmentFileBucket).upload(path, selectedFile, {
          contentType: details.mimeType,
          upsert: false,
        });
        if (uploadError) {
          toast.error(uploadError.message || 'Berkas belum berhasil diunggah.');
          return;
        }
        uploadedPath = path;
        nextAttachment = {
          path,
          fileName: selectedFile.name.slice(0, 255),
          fileSize: selectedFile.size,
          fileType: details.mimeType,
        };
      }
      let result: Awaited<ReturnType<typeof submitAssignmentAction>>;
      try {
        result = await submitAssignmentAction({ assignmentId: item.id, answer, attachment: nextAttachment });
      } catch (error) {
        if (uploadedPath) await supabase.storage.from(assignmentFileBucket).remove([uploadedPath]).catch(() => undefined);
        toast.error(error instanceof Error ? error.message : 'Jawaban belum berhasil dikirim.');
        return;
      }
      if (!result.ok) {
        if (uploadedPath) await supabase.storage.from(assignmentFileBucket).remove([uploadedPath]).catch(() => undefined);
        toast.error(result.error ?? 'Jawaban belum berhasil dikirim.');
        return;
      }
      const previousPath = submission?.attachment?.path;
      if (previousPath && previousPath !== nextAttachment?.path) {
        try {
          const { error: cleanupError } = await supabase.storage.from(assignmentFileBucket).remove([previousPath]);
          if (cleanupError) toast.warning('Jawaban tersimpan, tetapi lampiran lama belum dapat dihapus.');
        } catch {
          toast.warning('Jawaban tersimpan, tetapi lampiran lama belum dapat dihapus.');
        }
      }
      toast.success('Jawaban berhasil dikirim.');
      window.location.reload();
    });
  }

  return (
    <SectionCard as="article" className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-mint text-primary">{item.className}</Badge>
        <Badge className={isReviewed ? 'bg-mint text-primary' : submission ? 'bg-gold text-white' : 'bg-white text-muted-foreground'}>
          {isReviewed ? `Nilai ${submission?.score}/100` : submission ? 'Sudah dikirim' : isExpired ? 'Terlambat' : 'Belum dikerjakan'}
        </Badge>
      </div>
      <h2 className="mt-3 break-words text-lg font-bold text-ink">{item.title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{item.instructions}</p>
      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <CalendarClock className="h-4 w-4" />
        {item.dueAt ? `Batas ${formatDateTime(item.dueAt)}` : 'Tanpa batas waktu'}
      </p>

      {isReviewed && submission ? (
        <div className="mt-5 grid gap-3 border-t border-border pt-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Jawabanmu</p>
            {submission.answer && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{submission.answer}</p>}
            {submission.attachment && <AssignmentAttachmentDownload attachment={submission.attachment} isDemo={isDemo} />}
          </div>
          {submission.feedback && <p className="rounded-xl bg-mint/50 p-3 text-sm leading-6 text-foreground"><span className="font-bold text-primary">Catatan guru: </span>{submission.feedback}</p>}
        </div>
      ) : isExpired ? (
        submission && (
          <div className="mt-4 grid min-w-0 gap-3 rounded-xl border border-gold/30 bg-gold/10 p-3">
            <p className="text-sm leading-6 text-foreground">Jawabanmu sudah terkirim. Batas pengumpulan telah lewat.</p>
            {submission.answer && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{submission.answer}</p>}
            {submission.attachment && <AssignmentAttachmentDownload attachment={submission.attachment} isDemo={isDemo} />}
          </div>
        )
      ) : (
        <form onSubmit={submitAnswer} className="mt-5 grid min-w-0 gap-3 border-t border-border pt-4">
          {submission && <p className="text-sm font-semibold text-primary">Jawaban tersimpan. Kamu masih bisa memperbaruinya sampai guru memberi nilai.</p>}
          <label className="min-w-0 text-sm font-semibold text-ink">
            Jawaban teks <span className="font-normal text-muted-foreground">(opsional jika melampirkan berkas)</span>
            <Textarea name="answer" required={!hasAttachment} minLength={hasAttachment ? undefined : 20} maxLength={5000} defaultValue={submission?.answer ?? ''} rows={5} placeholder="Tulis jawabanmu di sini..." className="mt-2 min-h-32 rounded-xl bg-white text-sm leading-6" />
          </label>
          <div className="min-w-0 rounded-2xl border border-border bg-surface/70 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-primary"><FileUp className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">Lampirkan berkas <span className="font-normal text-muted-foreground">(opsional)</span></p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">PDF, dokumen Office, TXT, JPG, PNG, atau WebP · maks. {formatFileSize(maxAssignmentFileSize)}</p>
              </div>
            </div>
            {selectedFile ? (
              <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-border bg-white p-3">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{selectedFile.name} <span className="text-muted-foreground">({formatFileSize(selectedFile.size)})</span></span>
                <Button type="button" variant="ghost" size="icon" aria-label="Hapus pilihan berkas" className="h-9 w-9 shrink-0" onClick={() => setSelectedFile(null)}><X className="h-4 w-4" /></Button>
              </div>
            ) : retainedAttachment ? (
              <>
                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{retainedAttachment.fileName} <span className="text-muted-foreground">({formatFileSize(retainedAttachment.fileSize)})</span></span>
                  <Button type="button" variant="ghost" size="icon" aria-label="Hapus lampiran" className="h-9 w-9 shrink-0" onClick={() => setRemoveExistingFile(true)}><X className="h-4 w-4" /></Button>
                </div>
                <AssignmentAttachmentDownload attachment={retainedAttachment} isDemo={isDemo} />
              </>
            ) : (
              <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 bg-white px-4 py-3 text-sm font-semibold text-primary hover:bg-mint/40">
                <FileUp className="h-4 w-4" />Pilih berkas
                <input type="file" accept={assignmentFileAccept} className="sr-only" onChange={(event) => handleFileChange(event, isDemo, setSelectedFile)} />
              </label>
            )}
          </div>
          <Button type="submit" disabled={isPending} className="min-h-11 w-full sm:w-auto sm:justify-self-end"><Send className="h-4 w-4" />{submission ? 'Perbarui jawaban' : 'Kirim jawaban'}</Button>
        </form>
      )}
    </SectionCard>
  );
}

function handleFileChange(
  event: ChangeEvent<HTMLInputElement>,
  isDemo: boolean,
  setFile: (file: File | null) => void,
) {
  const file = event.currentTarget.files?.[0] ?? null;
  event.currentTarget.value = '';
  if (!file) return;
  const validation = getAssignmentFileDetails(file);
  if ('error' in validation) {
    toast.error(validation.error);
    return;
  }
  setFile(file);
}

function AssignmentAttachmentDownload({ attachment, isDemo }: { attachment: AssignmentAttachment; isDemo: boolean }) {
  const [isLoading, setIsLoading] = useState(false);

  async function download() {
    setIsLoading(true);
    try {
      let url: string;
      let revokeUrl = false;
      if (isDemo && attachment.demoFileId) {
        const stored = await getDemoAssignmentFile(attachment.demoFileId);
        if (!stored) throw new Error('Berkas demo tidak ditemukan di penyimpanan browser ini.');
        url = URL.createObjectURL(stored.file);
        revokeUrl = true;
      } else if (attachment.path) {
        const supabase = createClient();
        const { data, error } = await supabase.storage.from(assignmentFileBucket).createSignedUrl(attachment.path, 90, { download: attachment.fileName });
        if (error || !data) throw new Error(error?.message ?? 'Tautan unduh tidak tersedia.');
        url = data.signedUrl;
      } else {
        throw new Error('Lampiran ini tidak memiliki berkas unduhan.');
      }
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.append(link);
      link.click();
      link.remove();
      if (revokeUrl) window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lampiran belum dapat diunduh.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="mt-3 min-h-10 max-w-full justify-start" onClick={download} disabled={isLoading}>
      <Download className="h-4 w-4 shrink-0" />
      <span className="truncate">{isLoading ? 'Menyiapkan berkas…' : `Unduh ${attachment.fileName}`}</span>
      <span className="shrink-0 text-muted-foreground">{formatFileSize(attachment.fileSize)}</span>
    </Button>
  );
}

function AssignmentPagination({ basePath, page, hasNextPage, hasPreviousPage }: { basePath: string; page: number; hasNextPage: boolean; hasPreviousPage: boolean }) {
  if (!hasNextPage && !hasPreviousPage) return null;
  const href = (targetPage: number) => targetPage <= 1 ? basePath : `${basePath}?page=${targetPage}`;
  return (
    <nav aria-label="Navigasi halaman tugas" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-2">
      {hasPreviousPage ? <Button asChild variant="outline" size="sm" className="min-h-11 justify-self-start px-3"><Link href={href(page - 1)}>Lebih baru</Link></Button> : <span />}
      <span aria-current="page" className="text-center text-sm font-semibold text-muted-foreground">Halaman {page}</span>
      {hasNextPage ? <Button asChild variant="outline" size="sm" className="min-h-11 justify-self-end px-3"><Link href={href(page + 1)}>Lebih lama</Link></Button> : <span />}
    </nav>
  );
}

function parseLocalDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
