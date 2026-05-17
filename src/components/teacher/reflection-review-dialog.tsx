'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { reviewReflectionAction } from '@/lib/teacher/reflection-actions';
import type { TeacherReflectionItem } from '@/lib/teacher/reflections';

type ReflectionReviewDialogProps = {
  reflection: TeacherReflectionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReflectionReviewDialog({ reflection, open, onOpenChange }: ReflectionReviewDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [teacherNote, setTeacherNote] = useState(reflection?.teacherNote ?? '');

  useEffect(() => {
    setTeacherNote(reflection?.teacherNote ?? '');
  }, [reflection]);

  function handleSubmit(markReviewed: boolean) {
    if (!reflection) return;

    startTransition(async () => {
      const result = await reviewReflectionAction({
        reflectionId: reflection.id,
        teacherNote,
        markReviewed,
      });

      if (!result.ok) {
        toast.error(result.error ?? 'Review refleksi belum berhasil disimpan.');
        return;
      }

      toast.success(markReviewed ? 'Refleksi ditandai sudah ditinjau.' : 'Catatan guru tersimpan.');
      onOpenChange(false);
      router.refresh();
    });
  }

  if (!reflection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-ink">Tinjau Refleksi</DialogTitle>
          <DialogDescription>
            {reflection.studentName} - {reflection.className} - {reflection.moduleTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <ReviewBlock title="Refleksi Diri" content={reflection.reflectionText} />
          <ReviewBlock title="Aksi Nyata" content={reflection.actionPlan || 'Belum ada aksi nyata tertulis.'} />

          <label className="grid gap-2">
            <span className="text-sm font-bold text-ink">Catatan Guru</span>
            <Textarea
              value={teacherNote}
              onChange={(event) => setTeacherNote(event.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Tulis catatan atau umpan balik singkat untuk siswa..."
            />
            <span className="text-right text-xs text-muted-foreground">{teacherNote.length}/1000</span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => handleSubmit(false)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
            Simpan Catatan
          </Button>
          <Button type="button" disabled={isPending} onClick={() => handleSubmit(true)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Tandai Ditinjau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-border bg-mint/40 p-4">
      <p className="text-sm font-bold text-primary">{title}</p>
      <p className="app-readable mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{content}</p>
    </div>
  );
}
