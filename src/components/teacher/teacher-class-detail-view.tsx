'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Download,
  MessageSquareText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import type { TeacherClassActivity, TeacherClassDetailData, TeacherStudentProgress } from '@/lib/teacher/analytics';
import { cn } from '@/lib/utils';

type TeacherClassDetailViewProps = {
  data: TeacherClassDetailData;
};

type TabId = 'summary' | 'students' | 'modules' | 'activities' | 'settings';

const tabs: { id: TabId; label: string }[] = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'students', label: 'Siswa' },
  { id: 'modules', label: 'Modul' },
  { id: 'activities', label: 'Aktivitas' },
  { id: 'settings', label: 'Pengaturan' },
];

export function TeacherClassDetailView({ data }: TeacherClassDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [query, setQuery] = useState('');

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
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
        {activeTab === 'summary' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
            <SectionCard>
              <p className="font-bold text-ink">Student Progress Table</p>
              <StudentSearch value={query} onChange={setQuery} />
              <StudentProgressTable students={filteredStudents} />
            </SectionCard>

            <SectionCard>
              <p className="font-bold text-ink">Modul Kelas</p>
              {data.modules.length ? (
                <div className="mt-5 space-y-4">
                  {data.modules.map((moduleItem) => (
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
          <SectionCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-bold text-ink">Siswa</p>
              <StudentSearch value={query} onChange={setQuery} className="sm:max-w-sm" />
            </div>
            <StudentProgressTable students={filteredStudents} />
          </SectionCard>
        )}

        {activeTab === 'modules' && (
          <SectionCard>
            <p className="font-bold text-ink">Modul</p>
            {data.modules.length ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {data.modules.map((moduleItem) => (
                  <div key={moduleItem.id} className="rounded-2xl border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">{moduleItem.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{moduleItem.lessonsCount} lesson</p>
                      </div>
                      <ModuleStatusBadge status={moduleItem.status} />
                    </div>
                    <ProgressBar value={moduleItem.completionRate} label="Penyelesaian" showValue className="mt-4" />
                  </div>
                ))}
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

        {activeTab === 'activities' && (
          <SectionCard>
            <p className="font-bold text-ink">Aktivitas</p>
            <ActivityList activities={data.activities} />
          </SectionCard>
        )}

        {activeTab === 'settings' && (
          <SectionCard>
            <EmptyState
              icon={Settings}
              title="Pengaturan kelas belum tersedia"
              description="Pengaturan detail kelas akan ditambahkan pada tahap berikutnya."
            />
          </SectionCard>
        )}
      </div>
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

function StudentProgressTable({ students }: { students: TeacherStudentProgress[] }) {
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
    <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-bold">Siswa</th>
            <th className="px-4 py-3 font-bold">Progress</th>
            <th className="px-4 py-3 font-bold">Rata-rata Kuis</th>
            <th className="px-4 py-3 font-bold">Refleksi</th>
            <th className="px-4 py-3 font-bold">Modul Selesai</th>
            <th className="px-4 py-3 font-bold">Terakhir Aktif</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityList({ activities }: { activities: TeacherClassActivity[] }) {
  if (!activities.length) {
    return (
      <EmptyState
        className="mt-5"
        icon={Activity}
        title="Belum ada aktivitas"
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
