'use client';

import { useMemo, useState, useTransition } from 'react';
import { BarChart3, ClipboardCheck, Search, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { ClassFormDialog } from '@/components/teacher/class-form-dialog';
import { deleteTeacherClassAction } from '@/lib/teacher/class-actions';
import type { TeacherClassListItem } from '@/lib/teacher/classes';

type ClassesTableProps = {
  classes: TeacherClassListItem[];
};

export function ClassesTable({ classes }: ClassesTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const filteredClasses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return classes;

    return classes.filter(
      (classItem) =>
        classItem.name.toLowerCase().includes(normalizedQuery) ||
        (classItem.gradeLevel?.toLowerCase().includes(normalizedQuery) ?? false) ||
        (classItem.academicYear?.toLowerCase().includes(normalizedQuery) ?? false) ||
        classItem.classCode.toLowerCase().includes(normalizedQuery),
    );
  }, [classes, query]);

  function handleDelete(classItem: TeacherClassListItem) {
    if (classItem.totalStudents > 0) {
      toast.warning('Kelas masih memiliki siswa. Pindahkan siswa terlebih dahulu sebelum menghapus kelas.');
      return;
    }

    if (!window.confirm(`Hapus kelas "${classItem.name}"? Aksi ini tidak bisa dibatalkan.`)) return;

    setDeletingId(classItem.id);
    startTransition(async () => {
      const result = await deleteTeacherClassAction(classItem.id);

      if (!result.ok) {
        toast.error(result.error ?? 'Kelas belum berhasil dihapus.');
        setDeletingId(null);
        return;
      }

      toast.success('Kelas berhasil dihapus.');
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm lg:max-w-md lg:flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kelas..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <ClassFormDialog />
      </div>

      {filteredClasses.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredClasses.map((classItem) => (
            <SectionCard key={classItem.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xl font-extrabold text-ink">{classItem.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[classItem.gradeLevel, classItem.academicYear].filter(Boolean).join(' - ') || 'Tanpa tingkat'}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary">Kode Kelas: {classItem.classCode}</p>
                </div>
                <div className="flex gap-2">
                  <ClassFormDialog classItem={classItem} />
                  <Button asChild size="sm">
                    <Link href={`/teacher/classes/${classItem.id}`}>Lihat Detail</Link>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={isPending && deletingId === classItem.id}
                    onClick={() => handleDelete(classItem)}
                    aria-label={`Hapus kelas ${classItem.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Metric icon={Users} label="Total Siswa" value={classItem.totalStudents} />
                <Metric icon={Users} label="Siswa Aktif" value={classItem.activeStudents} />
                <Metric icon={BarChart3} label="Rata-rata Progress" value={`${classItem.averageProgress}%`} />
                <Metric icon={ClipboardCheck} label="Rata-rata Kuis" value={classItem.averageQuizScore || '-'} />
              </div>

              <ProgressBar value={classItem.averageProgress} label="Progress kelas" showValue className="mt-5" />
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={Users}
          title={classes.length ? 'Kelas tidak ditemukan' : 'Belum ada kelas'}
          description={
            classes.length
              ? 'Coba ubah kata kunci pencarian.'
              : 'Tambahkan kelas pertama untuk mulai mengelola peserta dan progress belajar.'
          }
          action={!classes.length ? <ClassFormDialog /> : undefined}
        />
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block font-extrabold text-ink">{value}</span>
      </span>
    </div>
  );
}
