'use client';

import { useEffect, useState, useTransition } from 'react';
import { PencilLine, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveTeacherClassAction } from '@/lib/teacher/class-actions';
import type { TeacherClassListItem } from '@/lib/teacher/classes';

type ClassFormDialogProps = {
  classItem?: TeacherClassListItem;
};

export function ClassFormDialog({ classItem }: ClassFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(classItem?.name ?? '');
  const [gradeLevel, setGradeLevel] = useState(classItem?.gradeLevel ?? '');
  const [academicYear, setAcademicYear] = useState(classItem?.academicYear ?? '');
  const [description, setDescription] = useState(classItem?.description ?? '');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(classItem?.name ?? '');
    setGradeLevel(classItem?.gradeLevel ?? '');
    setAcademicYear(classItem?.academicYear ?? '');
    setDescription(classItem?.description ?? '');
  }, [classItem, open]);

  function submit() {
    startTransition(async () => {
      const result = await saveTeacherClassAction({
        classId: classItem?.id,
        name,
        gradeLevel,
        academicYear,
        description,
      });

      if (!result.ok) {
        toast.error(result.error ?? 'Kelas belum berhasil disimpan.');
        return;
      }

      toast.success(classItem ? 'Kelas berhasil diperbarui.' : 'Kelas berhasil dibuat.');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={classItem ? 'outline' : 'default'} size={classItem ? 'sm' : 'default'}>
          {classItem ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {classItem ? 'Edit' : 'Tambah Kelas'}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{classItem ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle>
          <DialogDescription>Lengkapi informasi kelas yang akan dikelola di WASATIFY.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field label="Nama Kelas">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Kelas VIII A" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tingkat">
              <Input value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} placeholder="VIII" />
            </Field>
            <Field label="Tahun Ajaran">
              <Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="2026/2027" />
            </Field>
          </div>
          <Field label="Deskripsi">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Catatan singkat tentang kelas..."
              className="min-h-24"
            />
          </Field>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Simpan Kelas'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
