'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Megaphone, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveAnnouncementAction } from '@/lib/teacher/announcement-actions';
import type { TeacherAnnouncementClass, TeacherAnnouncementItem } from '@/lib/teacher/announcements';

type AnnouncementFormDialogProps = {
  classes: TeacherAnnouncementClass[];
  announcement?: TeacherAnnouncementItem;
};

export function AnnouncementFormDialog({ classes, announcement }: AnnouncementFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [content, setContent] = useState(announcement?.content ?? '');
  const [classId, setClassId] = useState(announcement?.classId ?? 'global');
  const [status, setStatus] = useState<'draft' | 'published'>(announcement?.status ?? 'draft');

  useEffect(() => {
    if (!open) return;
    setTitle(announcement?.title ?? '');
    setContent(announcement?.content ?? '');
    setClassId(announcement?.classId ?? 'global');
    setStatus(announcement?.status ?? 'draft');
  }, [announcement, open]);

  function handleSubmit() {
    startTransition(async () => {
      const result = await saveAnnouncementAction({
        id: announcement?.id,
        title,
        content,
        classId: classId === 'global' ? null : classId,
        status,
      });

      if (!result.ok) {
        toast.error(result.error ?? 'Pengumuman belum berhasil disimpan.');
        return;
      }

      toast.success(announcement ? 'Pengumuman diperbarui.' : 'Pengumuman dibuat.');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {announcement ? (
          <Button type="button" size="sm" variant="outline">
            Edit
          </Button>
        ) : (
          <Button type="button">
            <Plus className="h-4 w-4" />
            Buat Pengumuman
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold text-ink">
            <Megaphone className="h-5 w-5 text-primary" />
            {announcement ? 'Edit Pengumuman' : 'Buat Pengumuman'}
          </DialogTitle>
          <DialogDescription>Atur target kelas dan status publikasi pengumuman.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <Label>Judul</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Kuis Akhir Pekan" />
          </label>
          <label className="grid gap-2">
            <Label>Isi Pengumuman</Label>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={6}
              placeholder="Tulis informasi penting untuk siswa..."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <Label>Target</Label>
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="global">Semua Kelas</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
