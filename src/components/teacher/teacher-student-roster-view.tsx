'use client';

import { useMemo, useState } from 'react';
import { GraduationCap, RefreshCcw, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAsyncAction } from '@/hooks/use-async-action';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { resetStudentProgressAction } from '@/lib/teacher/class-actions';

export type TeacherStudentRosterRow = {
  id: string;
  fullName: string;
  email: string | null;
  classId: string;
  className: string;
  completedModules: number;
  progress: number;
  lastActiveAt: string | null;
};

export function TeacherStudentRosterView({ students }: { students: TeacherStudentRosterRow[] }) {
  const router = useRouter();
  const [isPending, runAction] = useAsyncAction();
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('all');
  const [page, setPage] = useState(1);
  const classes = useMemo(() => [...new Map(students.map((student) => [student.classId, student.className] as const)).entries()], [students]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return students.filter((student) => {
      const matchesQuery = `${student.fullName} ${student.email ?? ''} ${student.className}`.toLocaleLowerCase().includes(normalized);
      return matchesQuery && (classId === 'all' || student.classId === classId);
    });
  }, [classId, query, students]);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStudents = filtered.slice((page - 1) * pageSize, page * pageSize);
  const averageProgress = students.length ? Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length) : 0;
  const completedCount = students.reduce((sum, student) => sum + student.completedModules, 0);

  function resetProgress(student: TeacherStudentRosterRow) {
    const confirmed = window.confirm(
      `Reset seluruh progress materi, kuis, dan refleksi ${student.fullName} di kelas ${student.className}? Poin dan streak siswa tidak diubah. Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirmed) return;

    runAction(async () => {
      const result = await resetStudentProgressAction({
        classId: student.classId,
        studentId: student.id,
        dataType: 'all',
      });

      if (!result.ok) {
        toast.error(result.error ?? 'Progress siswa belum berhasil direset.');
        return;
      }

      toast.success(`Progress ${student.fullName} sudah direset.`);
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader eyebrow="Siswa" title="Data Siswa" description="Lihat daftar siswa, status belajar, dan ringkasan aktivitas dari kelas yang kamu ajar." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Siswa" value={students.length} description={`${classes.length} kelas`} icon={Users} />
        <StatCard label="Rata-rata Progress" value={`${averageProgress}%`} description="Progress seluruh siswa yang terdaftar" icon={GraduationCap} tone="mint" />
        <StatCard label="Modul Selesai" value={completedCount} description="Total status selesai pada seluruh siswa" icon={GraduationCap} tone="gold" />
      </div>
      <SectionCard className="mt-6 space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Cari siswa" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari nama atau email siswa..." className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" /></label>
          <select aria-label="Filter kelas siswa" value={classId} onChange={(event) => { setClassId(event.target.value); setPage(1); }} className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground"><option value="all">Semua Kelas</option>{classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        </div>
        {filtered.length ? (
          <><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="py-3 pr-4">Siswa</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Modul Selesai</th><th className="px-4 py-3">Progress</th><th className="py-3 pl-4">Terakhir Aktif</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody>{pageStudents.map((student) => <tr key={student.id} className="border-b border-border/70 last:border-0"><td className="py-4 pr-4"><p className="font-bold text-ink">{student.fullName}</p><p className="mt-1 text-xs text-muted-foreground">{student.email || 'Email tidak tersedia'}</p></td><td className="px-4 py-4 font-semibold text-foreground">{student.className}</td><td className="px-4 py-4 text-foreground">{student.completedModules}</td><td className="px-4 py-4"><div className="min-w-36"><ProgressBar value={student.progress} label="Progress" showValue /></div></td><td className="py-4 pl-4 text-muted-foreground">{student.lastActiveAt ? formatDateTime(student.lastActiveAt) : 'Belum ada aktivitas'}</td><td className="px-4 py-3 text-right"><Button type="button" variant="outline" size="sm" className="min-h-11" disabled={isPending} onClick={() => resetProgress(student)}><RefreshCcw className="h-4 w-4" />Reset progres</Button></td></tr>)}</tbody></table></div><div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-semibold text-muted-foreground">Menampilkan {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length} siswa</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Sebelumnya</Button><Button type="button" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Berikutnya</Button></div></div></>
        ) : <EmptyState icon={Users} title={students.length ? 'Siswa tidak ditemukan' : 'Belum ada siswa'} description={students.length ? 'Coba ubah kata kunci atau filter kelas.' : 'Siswa yang bergabung ke kelasmu akan tampil di sini.'} />}
      </SectionCard>
    </div>
  );
}
