'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Download,
  MessageSquareText,
  RefreshCcw,
  Search,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resetStudentProgressAction } from '@/lib/teacher/class-actions';
import type { TeacherClassActivity, TeacherClassDetailData, TeacherClassModule, TeacherStudentProgress } from '@/lib/teacher/analytics';
import { cn } from '@/lib/utils';

type TeacherClassDetailViewProps = {
  data: TeacherClassDetailData;
};

type TabId = 'overview' | 'students' | 'modules' | 'quizzes' | 'reflections';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'students', label: 'Daftar Siswa' },
  { id: 'modules', label: 'Progress Modul' },
  { id: 'quizzes', label: 'Nilai & Evaluasi' },
  { id: 'reflections', label: 'Refleksi' },
];

export function TeacherClassDetailView({ data }: TeacherClassDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [query, setQuery] = useState('');
  const [resetStudent, setResetStudent] = useState<TeacherStudentProgress | null>(null);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.students.filter((student) => {
      if (!normalizedQuery) return true;
      return (
        student.name.toLowerCase().includes(normalizedQuery) ||
        (student.email?.toLowerCase().includes(normalizedQuery) ?? false)
      );
    });
  }, [data.students, query]);

  return (
    <div className="mt-8 min-w-0 overflow-x-hidden">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Siswa"
          value={data.students.length}
          description="Peserta kelas"
          icon={Users}
          tone="mint"
        />
        <StatCard
          label="Tingkat Penyelesaian"
          value={`${data.metrics.completionRate}%`}
          description="Rata-rata progress siswa"
          icon={BarChart3}
        />
        <StatCard
          label="Rata-rata Kuis"
          value={data.metrics.averageQuizScore || '-'}
          description="Skor dari quiz attempts"
          icon={ClipboardCheck}
          tone="gold"
        />
        <StatCard
          label="Refleksi Terkumpul"
          value={data.metrics.reflectionsCount}
          description="Refleksi siswa"
          icon={MessageSquareText}
          tone="mint"
        />
        <StatCard
          label="Aktivitas Siswa"
          value={data.metrics.activitiesCount}
          description="Progress, kuis, refleksi"
          icon={Activity}
        />
      </div>

      <div className="mt-6 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition',
                activeTab === tab.id
                  ? 'border-primary bg-primary text-white shadow-card'
                  : 'border-border bg-white text-muted-foreground hover:bg-mint hover:text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button type="button" variant="outline" className="bg-white">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_0.78fr]">
            <SectionCard className="min-w-0">
              <p className="font-bold text-ink">Progress Kelas Overall</p>
              <ProgressBar value={data.metrics.completionRate} label="Rata-rata progress kelas" showValue className="mt-4" />
              <div className="mt-6">
                <p className="font-bold text-ink">Top Students by Progress</p>
              </div>
              <StudentSearch value={query} onChange={setQuery} />
              <StudentProgressTable students={[...filteredStudents].sort((first, second) => second.progress - first.progress).slice(0, 5)} />
            </SectionCard>

            <SectionCard className="min-w-0">
              <p className="font-bold text-ink">Modules Needing Attention</p>
              {data.modules.length ? (
                <div className="mt-5 space-y-4">
                  {[...data.modules].sort((first, second) => first.completionRate - second.completionRate).slice(0, 5).map((moduleItem) => (
                    <div key={moduleItem.id} className="rounded-2xl border border-border bg-white p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{moduleItem.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{moduleItem.lessonsCount} lesson</p>
                        </div>
                        <ModuleStatusBadge status={moduleItem.status} />
                      </div>
                      <ProgressBar value={moduleItem.completionRate} label="Penyelesaian" showValue />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-5 min-h-56"
                  icon={BookOpen}
                  title="Belum ada modul kelas"
                  description="Modul yang ditautkan ke kelas ini akan tampil di sini."
                />
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === 'students' && (
          <SectionCard className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-bold text-ink">Siswa</p>
              <StudentSearch value={query} onChange={setQuery} className="sm:max-w-sm" />
            </div>
            <StudentProgressTable students={filteredStudents} onResetStudent={setResetStudent} />
          </SectionCard>
        )}

        {activeTab === 'modules' && (
          <SectionCard className="min-w-0">
            <p className="font-bold text-ink">Progress Modul</p>
            {data.modules.length ? (
              <div className="-mx-1 mt-5 max-w-full overflow-x-auto rounded-2xl border border-border bg-white px-1">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-bold">Siswa</th>
                      {data.modules.map((moduleItem) => (
                        <th key={moduleItem.id} className="px-4 py-3 font-bold">{moduleItem.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 font-bold text-ink">{student.name}</td>
                        {data.modules.map((moduleItem) => (
                          <td key={moduleItem.id} className="px-4 py-3 text-muted-foreground">
                            {student.progress}%
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                className="mt-5"
                icon={BookOpen}
                title="Belum ada modul"
                description="Modul yang dihubungkan dengan kelas ini belum tersedia."
              />
            )}
          </SectionCard>
        )}

        {activeTab === 'quizzes' && (
          <SectionCard className="min-w-0">
            <p className="font-bold text-ink">Nilai & Evaluasi</p>
            <ActivityList activities={data.activities.filter((activity) => activity.type === 'quiz')} emptyTitle="Belum ada nilai kuis" />
          </SectionCard>
        )}

        {activeTab === 'reflections' && (
          <SectionCard className="min-w-0">
            <p className="font-bold text-ink">Refleksi</p>
            <ActivityList activities={data.activities.filter((activity) => activity.type === 'reflection')} emptyTitle="Belum ada refleksi" />
          </SectionCard>
        )}
      </div>

      {data.classInfo && (
        <ResetProgressDialog
          classId={data.classInfo.id}
          student={resetStudent}
          modules={data.modules}
          open={Boolean(resetStudent)}
          onOpenChange={(open) => {
            if (!open) setResetStudent(null);
          }}
        />
      )}
    </div>
  );
}

function StudentSearch({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('mt-4 flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm', className)}>
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cari siswa..."
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

function StudentProgressTable({
  students,
  onResetStudent,
}: {
  students: TeacherStudentProgress[];
  onResetStudent?: (student: TeacherStudentProgress) => void;
}) {
  if (!students.length) {
    return (
      <EmptyState
        className="mt-5"
        icon={Users}
        title="Siswa tidak ditemukan"
        description="Belum ada siswa di kelas ini atau pencarian tidak cocok."
      />
    );
  }

  return (
    <div className="-mx-1 mt-5 max-w-full overflow-x-auto rounded-2xl border border-border bg-white px-1">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-bold">Siswa</th>
            <th className="px-4 py-3 font-bold">Progress</th>
            <th className="px-4 py-3 font-bold">Rata-rata Kuis</th>
            <th className="px-4 py-3 font-bold">Refleksi</th>
            <th className="px-4 py-3 font-bold">Modul Selesai</th>
            <th className="px-4 py-3 font-bold">Terakhir Aktif</th>
            {onResetStudent && <th className="px-4 py-3 font-bold">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-mint/25">
              <td className="px-4 py-4">
                <p className="font-bold text-ink">{student.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{student.email ?? '-'}</p>
              </td>
              <td className="px-4 py-4">
                <ProgressBar value={student.progress} showValue />
              </td>
              <td className="px-4 py-4 font-semibold text-foreground">{student.averageQuizScore || '-'}</td>
              <td className="px-4 py-4 text-muted-foreground">{student.reflectionsCount}</td>
              <td className="px-4 py-4 text-muted-foreground">{student.completedModules}</td>
              <td className="px-4 py-4 text-muted-foreground">
                {student.lastActive ? formatDate(student.lastActive) : '-'}
              </td>
              {onResetStudent && (
                <td className="px-4 py-4">
                  <Button type="button" variant="outline" size="sm" className="bg-white" onClick={() => onResetStudent(student)}>
                    <RefreshCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResetProgressDialog({
  classId,
  student,
  modules,
  open,
  onOpenChange,
}: {
  classId: string;
  student: TeacherStudentProgress | null;
  modules: TeacherClassModule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'all' | 'module'>('all');
  const [moduleId, setModuleId] = useState('');
  const [isPending, startTransition] = useTransition();
  const selectableModules = modules.filter((moduleItem) => moduleItem.status === 'published');
  const canSubmit = Boolean(student && (mode === 'all' || moduleId));

  function submitReset() {
    if (!student) return;
    if (!canSubmit) {
      toast.warning('Pilih modul yang ingin direset.');
      return;
    }

    startTransition(async () => {
      const result = await resetStudentProgressAction({
        classId,
        studentId: student.id,
        moduleId: mode === 'module' ? moduleId : undefined,
      });

      if (!result.ok) {
        toast.error(result.error ?? 'Progress siswa belum berhasil direset.');
        return;
      }

      toast.success('Progress siswa berhasil direset.');
      onOpenChange(false);
      setMode('all');
      setModuleId('');
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reset progress siswa ini?</DialogTitle>
          <DialogDescription>
            Data progress, lesson, kuis, dan refleksi untuk modul milik guru kelas akan dihapus. Reset tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-mint/35 p-4">
            <p className="font-bold text-ink">{student?.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{student?.email ?? 'Siswa kelas'}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('all')}
              className={cn(
                'rounded-2xl border p-4 text-left text-sm font-bold transition',
                mode === 'all' ? 'border-primary bg-mint text-primary' : 'border-border bg-white text-foreground',
              )}
            >
              Reset semua progress
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">Hanya modul milik guru kelas ini.</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('module')}
              className={cn(
                'rounded-2xl border p-4 text-left text-sm font-bold transition',
                mode === 'module' ? 'border-primary bg-mint text-primary' : 'border-border bg-white text-foreground',
              )}
            >
              Reset per modul
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">Pilih satu modul tertentu.</span>
            </button>
          </div>

          {mode === 'module' && (
            <div>
              <label htmlFor="reset-module" className="text-sm font-bold text-ink">
                Modul
              </label>
              <Select value={moduleId} onValueChange={setModuleId}>
                <SelectTrigger id="reset-module" className="mt-2 h-12 rounded-xl bg-white">
                  <SelectValue placeholder="Pilih modul" />
                </SelectTrigger>
                <SelectContent>
                  {selectableModules.map((moduleItem) => (
                    <SelectItem key={moduleItem.id} value={moduleItem.id}>
                      {moduleItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectableModules.length && (
                <p className="mt-2 text-sm font-semibold text-gold">Belum ada modul published milik guru kelas ini.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={submitReset} disabled={isPending || !canSubmit}>
            {isPending ? 'Mereset...' : 'Reset Progress'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivityList({ activities, emptyTitle = 'Belum ada aktivitas' }: { activities: TeacherClassActivity[]; emptyTitle?: string }) {
  if (!activities.length) {
    return (
      <EmptyState
        className="mt-5"
        icon={Activity}
        title={emptyTitle}
        description="Aktivitas kuis, refleksi, dan penyelesaian modul akan tampil di sini."
      />
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
            {activity.type === 'quiz' ? (
              <ClipboardCheck className="h-5 w-5" />
            ) : activity.type === 'reflection' ? (
              <MessageSquareText className="h-5 w-5" />
            ) : (
              <BookOpen className="h-5 w-5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink">{activity.title}</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{activity.description}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">{formatDate(activity.date)}</span>
        </div>
      ))}
    </div>
  );
}

function ModuleStatusBadge({ status }: { status: 'published' | 'draft' | 'archived' }) {
  const className =
    status === 'published'
      ? 'border-primary/15 bg-mint text-primary'
      : status === 'draft'
        ? 'border-gold/20 bg-cream text-gold'
        : 'border-slate-200 bg-slate-100 text-slate-600';

  return (
    <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', className)}>
      {status === 'published' ? 'Aktif' : status === 'draft' ? 'Draft' : 'Nonaktif'}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}
